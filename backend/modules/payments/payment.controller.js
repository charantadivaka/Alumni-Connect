'use strict';

const paymentService = require('./payment.service');
const { sendSuccess } = require('../../shared/utils/response');

const createOrder = async (req, res, next) => {
    try {
        const order = await paymentService.createOrder(req.body);
        sendSuccess(res, order);
    } catch (err) {
        next(err);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const college = await paymentService.verifyPaymentAndRegister(req.body);
        sendSuccess(res, {
            id: college._id,
            name: college.name,
            feePaidUntil: college.feePaidUntil,
        }, 'Payment verified and college registered successfully!', 201);
    } catch (err) {
        next(err);
    }
};

module.exports = { createOrder, verifyPayment };
