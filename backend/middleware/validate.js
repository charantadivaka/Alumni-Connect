const { z } = require('zod');

/**
 * Middleware that parses and validates req.body, req.query, req.params using Zod.
 */
const validateZod = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ 
                message: err.issues[0].message, 
                errors: err.issues 
            });
        }
        next(err);
    }
};

// ── Rule Sets (Zod Schemas) ──────────────────────────────────────────────────

const validateLogin = validateZod(z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required')
    })
}));

const validateSendOtp = validateZod(z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        name: z.string().min(2, 'Name must be 2–100 characters').max(100, 'Name must be 2–100 characters'),
        password: z.string().min(6, 'Password must be 6–128 characters').max(128, 'Password must be 6–128 characters'),
        role: z.enum(['student', 'alumni'], { errorMap: () => ({ message: 'Role must be student or alumni' }) })
    })
}));

const validateForgotPassword = validateZod(z.object({
    body: z.object({
        email: z.string().email('Valid email is required')
    })
}));

const validateResetPassword = validateZod(z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z.string().min(6, 'New password must be 6–128 characters').max(128, 'New password must be 6–128 characters')
    })
}));

const validateChangePassword = validateZod(z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be 6–128 characters').max(128, 'New password must be 6–128 characters')
    })
}));

const validateCreateJob = validateZod(z.object({
    body: z.object({
        title: z.string().min(3, 'Job title must be 3–200 characters').max(200, 'Job title must be 3–200 characters'),
        company: z.string().min(1, 'Company name is required').max(200, 'Company name is required'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        jobType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'], {
            errorMap: () => ({ message: 'Invalid job type' })
        }).optional()
    })
}));

const validateRequestSession = validateZod(z.object({
    body: z.object({
        alumniId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid alumni ID is required'),
        topic: z.string().min(3, 'Topic must be 3–300 characters').max(300, 'Topic must be 3–300 characters')
    })
}));

const validateCreateThread = validateZod(z.object({
    body: z.object({
        title: z.string().min(3, 'Thread title must be 3–300 characters').max(300, 'Thread title must be 3–300 characters'),
        content: z.string().min(10, 'Content must be at least 10 characters')
    })
}));

const validateCreateEvent = validateZod(z.object({
    body: z.object({
        title: z.string().min(3, 'Event title must be 3–200 characters').max(200, 'Event title must be 3–200 characters'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        date: z.string().datetime({ message: 'Valid event date is required (ISO8601)' })
    })
}));

const validateCreateStory = validateZod(z.object({
    body: z.object({
        title: z.string().min(3, 'Story title must be 3–200 characters').max(200, 'Story title must be 3–200 characters'),
        content: z.string().min(30, 'Story content must be at least 30 characters')
    })
}));

module.exports = {
    validateZod,
    validateLogin,
    validateSendOtp,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
    validateCreateJob,
    validateRequestSession,
    validateCreateThread,
    validateCreateEvent,
    validateCreateStory,
};
