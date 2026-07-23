const pmSocketHandler = (io, socket) => {
    socket.on('ipcrf_submitted', (data) => {
        console.log(`New submission from ${data.employeeName}`);
        io.emit('admin_notification', {
            title: 'New IPCRF Submission',
            message: `${data.employeeName} has submitted their Phase 1 Commitment.`,
            type: 'success',
            timestamp: new Date()
        });
    });

    socket.on('rating_finalized', (data) => {
        io.emit('employee_notification', {
            employeeId: data.employeeId,
            message: 'Your Final IPCRF Rating has been uploaded. View in Phase 4.'
        });
    });
};

module.exports = { pmSocketHandler };
