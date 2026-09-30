const User = require('../models/User');
const Campaign = require('../models/Campaign');

// GET /api/users  (admin only)
async function getUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
}

// PUT /api/users/:id/role  (admin only)
async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!['admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'role must be "admin" or "manager"' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
}

// DELETE /api/users/:id  (admin only)
async function deleteUser(req, res) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Campaign.deleteMany({ owner: user._id });
    res.json({ message: 'User and their campaigns deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}

module.exports = { getUsers, updateUserRole, deleteUser };
