const Connection = require('../models/Connection');
const User = require('../models/User');

let ioInstance;
exports.setIo = (io) => { ioInstance = io; };

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
exports.sendRequest = async (req, res, next) => {
    try {
        const receiverId = req.params.userId;
        const senderId = req.user._id;

        if (receiverId === senderId.toString()) {
            return res.status(400).json({ message: "Cannot connect with yourself." });
        }

        const existing = await Connection.findOne({ sender: senderId, receiver: receiverId });
        if (existing) {
            return res.status(400).json({ message: `Connection already ${existing.status.toLowerCase()}.` });
        }

        const connection = await Connection.create({ sender: senderId, receiver: receiverId });
        
        res.status(201).json({ message: "Connection request sent.", connection });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Request already exists." });
        next(error);
    }
};

// @desc    Get all connections for current user (sent or received)
// @route   GET /api/connections/my
exports.getMyConnections = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const connections = await Connection.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender',   'name role company designation profilePicture bio skills department year rollNo graduationYear')
            .populate('receiver', 'name role company designation profilePicture bio skills department year rollNo graduationYear');
        
        res.json(connections);
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to connection request
// @route   PUT /api/connections/:id/respond
exports.respondRequest = async (req, res, next) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'
        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const connection = await Connection.findById(req.params.id);
        if (!connection) return res.status(404).json({ message: "Connection request not found." });

        if (connection.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to respond to this request." });
        }

        connection.status = status;
        await connection.save();

        res.json({ message: `Connection ${status.toLowerCase()}`, connection });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a connection
// @route   DELETE /api/connections/:id
exports.removeConnection = async (req, res, next) => {
    try {
        const connection = await Connection.findById(req.params.id);
        if (!connection) return res.status(404).json({ message: "Connection not found." });

        if (connection.sender.toString() !== req.user._id.toString() && connection.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized." });
        }

        await connection.deleteOne();
        res.json({ message: "Connection removed." });
    } catch (error) {
        next(error);
    }
};

// @desc    Get students from the same college (for Network → Students tab)
// @route   GET /api/connections/students-directory
exports.getStudentsDirectory = async (req, res, next) => {
    try {
        const me = await User.findById(req.user._id).select('college');
        if (!me || !me.college) {
            return res.json({ noCollege: true, students: [] });
        }
        const students = await User.find({
            role: 'student',
            college: me.college,
            _id: { $ne: req.user._id },
        }).select('name email department year rollNo bio skills profilePicture college');

        const College = require('../models/College');
        const col = await College.findById(me.college).select('name');
        res.json({ students, collegeName: col?.name || '', noCollege: false });
    } catch (error) {
        next(error);
    }
};
