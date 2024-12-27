const express = require('express');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

let students = [];

let courses = [
    { id: 1, name: "Math 101", popularity: 0 },
    { id: 2, name: "History 101", popularity: 0 },
    { id: 3, name: "Physics 101", popularity: 0 }
];

// Function to load students from insert.txt and update students.txt
const loadAndUpdateStudentsFromFile = async () => {
    try {
        const data = await fs.readFile('insert.txt', 'utf8');
        const newStudents = data.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line));

        const studentLines = [];

        newStudents.forEach(student => {
            students.push(student);

            
            student.courses.forEach(courseName => {
                const course = courses.find(c => c.name === courseName);
                if (course) {
                    course.popularity += 1;
                }
            });

            // Prepare data to append to students.txt
            studentLines.push(JSON.stringify(student));
        });

        // Append the new student data to students.txt
        await fs.appendFile('students.txt', studentLines.join('\n') + '\n', 'utf8');

        console.log("Students loaded from insert.txt and updated in students.txt successfully.");
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error("Error loading students from file:", error);
        } else {
            console.log("No insert.txt file found. Skipping load.");
        }
    }
};

// API to manually load students from insert.txt
app.get('/loadAndUpdateStudents', async (req, res) => {
    try {
        await loadAndUpdateStudentsFromFile();
        res.status(200).json({ message: 'Students loaded from insert.txt and updated in students.txt successfully!' });
    } catch (error) {
        console.error("Error loading and updating students:", error);
        res.status(500).json({ message: 'Failed to load and update students from file.' });
    }
});

app.post('/addStudent', async (req, res) => {
    const student = req.body;

    if (!student.id || !student.name || !student.courses || student.courses.length === 0) {
        return res.status(400).json({ message: 'Missing required student data (id, name, courses)' });
    }

    try {
        students.push(student);

        student.courses.forEach(courseName => {
            const course = courses.find(c => c.name === courseName);
            if (course) {
                course.popularity += 1;
            }
        });

        await fs.appendFile('students.txt', JSON.stringify(student) + '\n', 'utf8');

        res.status(200).json({ message: 'Student added successfully!' });
    } catch (error) {
        console.error("Error adding student:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/sortCourses', (req, res) => {
    const sortedCourses = [...courses].sort((a, b) => b.popularity - a.popularity);
    res.json(sortedCourses);
});

app.get('/searchCourse/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
    const course = courses.find(c => c.id === courseId);

    if (course) {
        res.status(200).json(course);
    } else {
        res.status(404).json({ message: 'Course not found' });
    }
});

app.get('/searchStudent', (req, res) => {
    const { id, name } = req.query;

    if (!id && !name) {
        return res.status(400).json({ message: 'Please provide either id or name as a query parameter' });
    }

    const result = students.filter(student =>
        (id && student.id === parseInt(id)) || (name && student.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (result.length > 0) {
        res.status(200).json(result);
    } else {
        res.status(404).json({ message: 'No matching students found' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
