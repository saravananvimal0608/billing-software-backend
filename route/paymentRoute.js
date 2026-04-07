import express from 'express'
import { createPayment ,getPaymentDetails} from '../controller/paymentController.js'
import superAdmin from '../middleware/superAdminMiddleware.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/',authMiddleware ,superAdmin, createPayment)
router.get('/',authMiddleware ,superAdmin, getPaymentDetails)

export default router