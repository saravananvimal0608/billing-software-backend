import { loginUser, createAdmin, allUserByShop, deleteUser, forgotPassword, resetPassword,verifyOtp, createSalesman, createSuperAdmin, singleUser,updateUser ,bulkDeleteUser,allUser} from '../controller/userController.js'
import express from 'express'
import adminMiddleware from './../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js'
import superAdminMiddleware from '../middleware/superAdminMiddleware.js';

const router = express.Router()

//superAdmin
router.post('/create/admin', createAdmin)
router.post('/create/superAdmin', createSuperAdmin)
router.get('/allUserSuper', authMiddleware, superAdminMiddleware, allUser)

// admin 
router.post('/create/salesman', authMiddleware, adminMiddleware, createSalesman)
router.get('/allUser', authMiddleware, adminMiddleware, allUserByShop)
router.delete('/bulk', authMiddleware, adminMiddleware, bulkDeleteUser)
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteUser)
router.get('/user/:id', authMiddleware, adminMiddleware, singleUser)
router.put('/updateUser/:id', authMiddleware, adminMiddleware, updateUser)

// verify email 
router.post('/verifyotp', verifyOtp)

//common
router.post('/login', loginUser)
router.post('/forgotmail', forgotPassword)
router.post('/reset-password', resetPassword)
export default router
