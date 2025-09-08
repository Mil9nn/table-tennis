import { withAuth } from '@/lib/auth.js';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
};

export default withAuth(handler);