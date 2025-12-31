// Socket.io handlers for real-time features
const Order = require('../models/Order');
const Driver = require('../models/Driver');

const initializeSocket = (io) => {
    // Store connected users
    const connectedUsers = new Map();
    const connectedDrivers = new Map();
    const connectedRestaurants = new Map();

    io.on('connection', (socket) => {
        console.log(`🔌 New connection: ${socket.id}`);

        // User joins - store their socket ID
        socket.on('join', ({ userId, role }) => {
            console.log(`👤 User ${userId} joined as ${role}`);

            if (role === 'customer') {
                connectedUsers.set(userId, socket.id);
            } else if (role === 'driver') {
                connectedDrivers.set(userId, socket.id);
            } else if (role === 'restaurant') {
                connectedRestaurants.set(userId, socket.id);
            }

            socket.userId = userId;
            socket.userRole = role;
        });

        // Customer subscribes to order updates
        socket.on('subscribe_order', ({ orderId }) => {
            socket.join(`order_${orderId}`);
            console.log(`📦 Socket ${socket.id} subscribed to order ${orderId}`);
        });

        // Unsubscribe from order updates
        socket.on('unsubscribe_order', ({ orderId }) => {
            socket.leave(`order_${orderId}`);
        });

        // Restaurant joins their order room
        socket.on('restaurant_join', ({ restaurantId }) => {
            socket.join(`restaurant_${restaurantId}`);
            console.log(`🍕 Restaurant ${restaurantId} joined`);
        });

        // Driver goes online
        socket.on('driver_online', async ({ driverId }) => {
            try {
                await Driver.findByIdAndUpdate(driverId, { isOnline: true });
                socket.join('available_drivers');
                console.log(`🚗 Driver ${driverId} is now online`);
            } catch (error) {
                console.error('Driver online error:', error);
            }
        });

        // Driver goes offline
        socket.on('driver_offline', async ({ driverId }) => {
            try {
                await Driver.findByIdAndUpdate(driverId, { isOnline: false });
                socket.leave('available_drivers');
                console.log(`🚗 Driver ${driverId} is now offline`);
            } catch (error) {
                console.error('Driver offline error:', error);
            }
        });

        // Driver location update
        socket.on('driver_location', async ({ driverId, orderId, coordinates }) => {
            try {
                // Update driver location in database
                await Driver.findByIdAndUpdate(driverId, {
                    currentLocation: {
                        type: 'Point',
                        coordinates,
                    },
                    lastLocationUpdate: new Date(),
                });

                // If driver has an active order, update order location and notify customer
                if (orderId) {
                    await Order.findByIdAndUpdate(orderId, {
                        driverLocation: {
                            type: 'Point',
                            coordinates,
                        },
                    });

                    // Emit to order room
                    io.to(`order_${orderId}`).emit('driver_location_update', {
                        orderId,
                        driverId,
                        coordinates,
                        timestamp: new Date(),
                    });
                }
            } catch (error) {
                console.error('Location update error:', error);
            }
        });

        // Order status update
        socket.on('order_status_update', async ({ orderId, status, note }) => {
            try {
                const order = await Order.findById(orderId);
                if (order) {
                    // Emit to order room (customer watching)
                    io.to(`order_${orderId}`).emit('order_updated', {
                        orderId,
                        status,
                        note,
                        timestamp: new Date(),
                    });

                    // Emit to restaurant
                    io.to(`restaurant_${order.restaurant}`).emit('order_updated', {
                        orderId,
                        status,
                        note,
                    });
                }
            } catch (error) {
                console.error('Order status update error:', error);
            }
        });

        // New order notification to restaurant
        socket.on('new_order', ({ restaurantId, order }) => {
            io.to(`restaurant_${restaurantId}`).emit('new_order', {
                order,
                timestamp: new Date(),
            });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`🔌 Disconnected: ${socket.id}`);

            if (socket.userId) {
                if (socket.userRole === 'customer') {
                    connectedUsers.delete(socket.userId);
                } else if (socket.userRole === 'driver') {
                    connectedDrivers.delete(socket.userId);
                    // Set driver offline when they disconnect
                    try {
                        await Driver.findOneAndUpdate(
                            { user: socket.userId },
                            { isOnline: false }
                        );
                    } catch (error) {
                        console.error('Driver disconnect error:', error);
                    }
                } else if (socket.userRole === 'restaurant') {
                    connectedRestaurants.delete(socket.userId);
                }
            }
        });
    });

    // Helper functions to emit from anywhere in the app
    const emitToUser = (userId, event, data) => {
        const socketId = connectedUsers.get(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    };

    const emitToDriver = (driverId, event, data) => {
        const socketId = connectedDrivers.get(driverId);
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    };

    const emitToRestaurant = (restaurantId, event, data) => {
        io.to(`restaurant_${restaurantId}`).emit(event, data);
    };

    const emitToOrder = (orderId, event, data) => {
        io.to(`order_${orderId}`).emit(event, data);
    };

    const emitToAvailableDrivers = (event, data) => {
        io.to('available_drivers').emit(event, data);
    };

    return {
        emitToUser,
        emitToDriver,
        emitToRestaurant,
        emitToOrder,
        emitToAvailableDrivers,
    };
};

module.exports = initializeSocket;
