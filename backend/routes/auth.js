const express = require('express');
const router = express.Router();

const mockUsers = [
  {
    id: 1,
    fullName: "Karthik Raja",
    email: "karthik.citizen@civiclens.ai",
    password: "password123",
    role: "Citizen",
    phone: "+91 98765 43210",
    avatar: "KR"
  },
  {
    id: 2,
    fullName: "Er. Sundaram P.",
    email: "officer.sundaram@civiclens.ai",
    password: "password123",
    role: "Municipal Officer",
    phone: "+91 44 2888 1001",
    avatar: "SP"
  }
];

// POST /api/auth/signin
router.post('/signin', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || user.password !== password) {
    return res.status(401).json({ detail: "Invalid email or password" });
  }

  const token = `cl-token-${user.id}-${Date.now()}`;
  res.json({
    accessToken: token,
    tokenType: "bearer",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { fullName, email, password, role, phone } = req.body;
  
  const existing = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: "User with this email already exists." });
  }

  const parts = fullName.split(' ');
  const avatar = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();

  const newUser = {
    id: mockUsers.length + 1,
    fullName,
    email,
    password,
    role: role || "Citizen",
    phone: phone || "",
    avatar
  };

  mockUsers.push(newUser);

  const token = `cl-token-${newUser.id}-${Date.now()}`;
  res.status(201).json({
    accessToken: token,
    tokenType: "bearer",
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatar: newUser.avatar
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ detail: "Authorization token required" });
  }
  
  res.json(mockUsers[0]);
});

module.exports = router;
