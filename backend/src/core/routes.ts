import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from './db';
import { AuthRequest, createToken, requireAuth } from './auth';

const router = Router();
const errorsFor = (req: Parameters<typeof validationResult>[0]) => validationResult(req).array().map((error) => error.msg);

router.post('/auth/register',
  body('firstName').trim().isLength({ min: 2, max: 100 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2, max: 100 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('phone').matches(/^\+254[17]\d{8}$/).withMessage('Use a Kenyan number such as +254712345678'),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/).withMessage('Password needs 8 characters, a capital letter and a number'),
  async (req, res, next) => { try {
    const errors = errorsFor(req); if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    const { firstName, lastName, email, phone, password } = req.body;
    if ((await query('SELECT id FROM users WHERE email=$1 OR phone=$2', [email, phone])).length) return res.status(409).json({ success: false, message: 'An account already exists with this email or phone' });
    const hash = await bcrypt.hash(password, 12);
    const user = (await query<{id:string;email:string;phone:string;first_name:string;last_name:string}>('INSERT INTO users(email,phone,password_hash,first_name,last_name) VALUES($1,$2,$3,$4,$5) RETURNING id,email,phone,first_name,last_name', [email, phone, hash, firstName, lastName]))[0];
    return res.status(201).json({ success: true, message: 'Account created', data: { token: createToken({ id: user.id, email: user.email }), user: { id:user.id,email:user.email,phone:user.phone,firstName:user.first_name,lastName:user.last_name } } });
  } catch (error) { return next(error); } });

router.post('/auth/login', body('email').isEmail().normalizeEmail(), body('password').notEmpty(), async (req, res, next) => { try {
  if (errorsFor(req).length) return res.status(400).json({ success:false,message:'Enter a valid email and password' });
  const user = (await query<{id:string;email:string;phone:string;first_name:string;last_name:string;password_hash:string}>('SELECT id,email,phone,first_name,last_name,password_hash FROM users WHERE email=$1 AND deleted_at IS NULL', [req.body.email]))[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return res.status(401).json({ success:false,message:'Invalid email or password' });
  await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
  return res.json({ success:true,message:'Login successful',data:{token:createToken({id:user.id,email:user.email}),user:{id:user.id,email:user.email,phone:user.phone,firstName:user.first_name,lastName:user.last_name}} });
} catch (error) { return next(error); } });

router.get('/auth/me', requireAuth, async (req: AuthRequest, res, next) => { try {
  const user=(await query('SELECT id,email,phone,first_name AS "firstName",last_name AS "lastName",is_email_verified AS "emailVerified" FROM users WHERE id=$1',[req.user!.id]))[0];
  return user ? res.json({success:true,data:user}) : res.status(404).json({success:false,message:'Account not found'});
} catch(error){return next(error);} });

router.get('/products', async (_req,res,next)=>{try{const rows=await query('SELECT id,product_code AS code,name,description,min_amount AS "minAmount",max_amount AS "maxAmount",min_term AS "minTerm",max_term AS "maxTerm",interest_rate AS "interestRate",processing_fee AS "processingFee",currency FROM loan_products WHERE status=\'ACTIVE\' ORDER BY min_amount');return res.json({success:true,data:rows});}catch(error){return next(error);}});

router.get('/loans/applications', requireAuth, async(req:AuthRequest,res,next)=>{try{const rows=await query('SELECT la.id,la.application_number AS "applicationNumber",lp.name AS product,la.loan_amount AS amount,la.loan_term AS term,la.purpose,la.status,la.interest_rate AS "interestRate",la.total_amount_payable AS "totalPayable",la.created_at AS "createdAt" FROM loan_applications la JOIN loan_products lp ON lp.id=la.product_id WHERE la.user_id=$1 ORDER BY la.created_at DESC',[req.user!.id]);return res.json({success:true,data:rows});}catch(error){return next(error);}});

router.post('/loans/applications', requireAuth, body('productId').isUUID(), body('amount').isFloat({min:1000}), body('term').isInt({min:1,max:36}), body('purpose').trim().isLength({min:5,max:255}), async(req:AuthRequest,res,next)=>{try{
  const errors=errorsFor(req);if(errors.length)return res.status(400).json({success:false,message:errors[0],errors});
  const product=(await query<{id:string;min_amount:string;max_amount:string;min_term:number;max_term:number;interest_rate:string;processing_fee:string}>('SELECT * FROM loan_products WHERE id=$1 AND status=\'ACTIVE\'',[req.body.productId]))[0];
  if(!product)return res.status(404).json({success:false,message:'Loan product not found'});
  const amount=Number(req.body.amount),term=Number(req.body.term);
  if(amount<Number(product.min_amount)||amount>Number(product.max_amount)||term<product.min_term||term>product.max_term)return res.status(400).json({success:false,message:'Amount or term is outside this product\'s limits'});
  const interest=amount*(Number(product.interest_rate)/100)*(term/12),fee=amount*(Number(product.processing_fee||0)/100),total=amount+interest+fee,monthly=total/term;
  const number=`PPL-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
  const application=(await query('INSERT INTO loan_applications(user_id,product_id,application_number,loan_amount,loan_term,purpose,status,interest_rate,processing_fee,total_amount_payable,monthly_payment) VALUES($1,$2,$3,$4,$5,$6,\'SUBMITTED\',$7,$8,$9,$10) RETURNING id,application_number AS "applicationNumber",status,total_amount_payable AS "totalPayable",monthly_payment AS "monthlyPayment"',[req.user!.id,product.id,number,amount,term,req.body.purpose,product.interest_rate,fee,total,monthly]))[0];
  return res.status(201).json({success:true,message:'Loan application submitted for review',data:application});
}catch(error){return next(error);}});

router.get('/kyc', requireAuth, async(req:AuthRequest,res,next)=>{try{const row=(await query('SELECT id,id_type AS "idType",id_number AS "idNumber",verification_status AS status,rejection_reason AS "rejectionReason",created_at AS "createdAt" FROM kyc_verifications WHERE user_id=$1',[req.user!.id]))[0]||null;return res.json({success:true,data:row});}catch(error){return next(error);}});
router.post('/kyc', requireAuth, body('idType').isIn(['NATIONAL_ID','PASSPORT','DRIVING_LICENSE']), body('idNumber').trim().isLength({min:5,max:50}), async(req:AuthRequest,res,next)=>{try{const errors=errorsFor(req);if(errors.length)return res.status(400).json({success:false,message:errors[0]});const row=(await query('INSERT INTO kyc_verifications(user_id,id_type,id_number,verification_status) VALUES($1,$2,$3,\'PENDING\') ON CONFLICT(user_id) DO UPDATE SET id_type=EXCLUDED.id_type,id_number=EXCLUDED.id_number,verification_status=\'PENDING\',updated_at=NOW() RETURNING id,id_type AS "idType",id_number AS "idNumber",verification_status AS status',[req.user!.id,req.body.idType,req.body.idNumber]))[0];return res.status(201).json({success:true,message:'Identity details submitted for verification',data:row});}catch(error){return next(error);}});
router.get('/payments', requireAuth, async(req:AuthRequest,res,next)=>{try{const rows=await query('SELECT id,payment_amount AS amount,currency,payment_method AS method,transaction_reference AS reference,payment_status AS status,payment_date AS "paymentDate" FROM payments WHERE user_id=$1 ORDER BY payment_date DESC',[req.user!.id]);return res.json({success:true,data:rows});}catch(error){return next(error);}});

router.post('/contact', body('name').trim().isLength({min:2,max:120}), body('email').isEmail().normalizeEmail(), body('subject').trim().isLength({min:3,max:160}), body('message').trim().isLength({min:10,max:4000}), async(req,res,next)=>{try{const errors=errorsFor(req);if(errors.length)return res.status(400).json({success:false,message:errors[0]});const row=(await query('INSERT INTO support_requests(name,email,phone,subject,message) VALUES($1,$2,$3,$4,$5) RETURNING reference',[req.body.name,req.body.email,req.body.phone||null,req.body.subject,req.body.message]))[0];return res.status(201).json({success:true,message:'Your request has been received',data:row});}catch(error){return next(error);}});

export default router;
