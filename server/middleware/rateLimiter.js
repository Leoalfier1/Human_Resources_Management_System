const rateLimitStore = new Map();

function rateLimit({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const timestamps = rateLimitStore.get(key).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    timestamps.push(now);
    rateLimitStore.set(key, timestamps);
    next();
  };
}

module.exports = { rateLimit };
