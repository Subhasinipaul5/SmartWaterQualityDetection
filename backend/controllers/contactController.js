const Contact = require('../models/Contact');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Private (logged-in users) or Public with name/email
const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const contact = await Contact.create({
      name, email, subject, message,
      userId: req.user?._id || null,
    });
    res.status(201).json({ success: true, message: 'Message sent successfully! Admin will get back to you soon.', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all messages (admin only)
// @route   GET /api/contact
// @access  Admin only
const getMessages = async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark message as read
// @route   PUT /api/contact/:id/read
// @access  Admin only
const markRead = async (req, res) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitContact, getMessages, markRead };
