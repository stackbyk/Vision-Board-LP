const bookingDialog = document.querySelector('#booking-dialog');
document.querySelector('.hero-copy .cta').addEventListener('click', () => bookingDialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => bookingDialog.close());
bookingDialog.addEventListener('click', (event) => {
  if (event.target === bookingDialog) {
    const bounds = bookingDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) bookingDialog.close();
  }
});
