import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';

const onlineUsers = new Map();
let io;

export const configureSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user.id;
      socket.user = user.toPublicJSON();
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    io.emit('user:online', { userId, username: socket.user.username });

    const userGroups = await Group.find({ 'members.user': userId }).select('_id');
    userGroups.forEach((group) => {
      socket.join(`group:${group._id}`);
    });

    socket.on('group:join', async (groupId) => {
      const isMember = await Group.exists({ _id: groupId, 'members.user': userId });
      if (isMember) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('message:send', async (data, callback) => {
      try {
        const { groupId, content, messageType = 'text' } = data;
        if (!groupId || !content) return callback?.({ error: 'Missing required fields' });

        const isMember = await Group.exists({ _id: groupId, 'members.user': userId });
        if (!isMember) return callback?.({ error: 'Not a member' });

        const message = await Message.create({
          group: groupId,
          sender: userId,
          content,
          messageType,
        });

        const populated = await Message.findById(message._id)
          .populate('sender', 'username displayName avatar');

        io.to(`group:${groupId}`).emit('message:new', populated);

        await Group.findByIdAndUpdate(groupId, {
          $set: { lastActivityDate: new Date() },
        });

        callback?.({ success: true, message: populated });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    socket.on('message:read', async (data) => {
      const { messageIds, groupId } = data;
      if (!messageIds || !groupId) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, group: groupId },
        { $addToSet: { readBy: userId } }
      );

      io.to(`group:${groupId}`).emit('message:read', {
        messageIds,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('message:delete', async (data) => {
      const { messageId, groupId } = data;
      if (!messageId) return;

      const message = await Message.findOne({ _id: messageId, group: groupId });
      if (!message || (message.sender.toString() !== userId)) return;

      message.isDeleted = true;
      await message.save();

      io.to(`group:${groupId}`).emit('message:deleted', { messageId });
    });

    socket.on('typing:start', (data) => {
      const { groupId } = data;
      socket.to(`group:${groupId}`).emit('typing:start', {
        userId,
        username: socket.user.username,
        groupId,
      });
    });

    socket.on('typing:stop', (data) => {
      const { groupId } = data;
      socket.to(`group:${groupId}`).emit('typing:stop', {
        userId,
        username: socket.user.username,
        groupId,
      });
    });

    socket.on('group:activity', (data) => {
      const { groupId, type, payload } = data;
      io.to(`group:${groupId}`).emit('group:activity', {
        userId,
        username: socket.user.username,
        type,
        payload,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId, username: socket.user.username });
    });
  });

  return io;
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
export const getIO = () => io;
