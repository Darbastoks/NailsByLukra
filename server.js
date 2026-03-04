require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Existing sqlite connection

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname, '')));

// GET /api/available-times?date=YYYY-MM-DD
app.get('/api/available-times', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Data privaloma' });

    db.all(`SELECT time FROM reservations WHERE date = ? AND status != 'cancelled'`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Duomenų bazės klaida' });
        const bookedTimes = rows.map(r => r.time);
        res.json({ bookedTimes });
    });
});

// POST /api/reservations
app.post('/api/reservations', (req, res) => {
    const { name, phone, service, date, time, notes } = req.body;
    if (!name || !phone || !service || !date || !time) {
        return res.status(400).json({ error: 'Užpildykite visus privalomus laukus' });
    }

    // Check double booking
    db.get(`SELECT count(*) as count FROM reservations WHERE date = ? AND time = ? AND status != 'cancelled'`, [date, time], (err, row) => {
        if (err) return res.status(500).json({ error: 'Serverio klaida patikrinant laiką' });
        if (row.count > 0) return res.status(409).json({ error: 'Šis laikas jau užimtas' });

        db.run(
            `INSERT INTO reservations (name, phone, service, date, time, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [name, phone, service, date, time, notes || ''],
            function (err) {
                if (err) return res.status(500).json({ error: 'Nepavyko išsaugoti rezervacijos' });
                res.status(201).json({ success: true, bookingId: this.lastID });
            }
        );
    });
});

// GET /api/reservations (For Admin Panel)
app.get('/api/reservations', (req, res) => {
    db.all(`SELECT * FROM reservations ORDER BY date DESC, time ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Klaida gaunant rezervacijas' });
        res.json(rows);
    });
});

// PATCH /api/reservations/:id/status (For Admin Panel)
app.patch('/api/reservations/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE reservations SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'Nepavyko atnaujinti statuso' });
        res.json({ success: true });
    });
});

// Admin fallback
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Ensure sqlite database file overrides correctly
app.listen(PORT, () => {
    console.log(`Nails by Lukra server running on port ${PORT}`);
});
