const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL
 * @param {Object} payload Safe ticket details (bookingId, verificationToken, showDate)
 * @returns {Promise<string>} Base64 image data URL
 */
const generateTicketQRCode = async (payload) => {
  try {
    const stringified = JSON.stringify({
      ref: payload.bookingId,
      token: payload.verificationToken,
      date: payload.showDate,
      time: payload.showTime,
      seats: payload.seatNumbers,
      v: '1.0',
    });

    const qrDataUrl = await QRCode.toDataURL(stringified, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

module.exports = {
  generateTicketQRCode,
};
