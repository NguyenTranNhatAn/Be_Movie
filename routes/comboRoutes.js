// routes/comboRoutes.js
const express = require('express');
const router = express.Router();
const Combo = require('../models/Combo');

// Tạo combo mới
router.post('/add', async (req, res) => {
    try {
        const { name, price, description, note, image, quantity } = req.body;
        const newCombo = new Combo({ name, price, description, note, image, quantity });
        await newCombo.save();
        res.status(201).json(newCombo);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo combo', error });
    }
});

// Lấy danh sách các combo
router.get('/getAll', async (req, res) => {
    try {
        const combos = await Combo.find();
        res.status(200).json(combos);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách combo', error });
    }
});

// Cập nhật số lượng combo
router.put('/update-quantity/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        const combo = await Combo.findByIdAndUpdate(id, { quantity }, { new: true });
        if (!combo) return res.status(404).json({ message: 'Không tìm thấy combo' });
        res.status(200).json(combo);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật số lượng', error });
    }
});

module.exports = router;
