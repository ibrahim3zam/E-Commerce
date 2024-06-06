import { userModel } from '../../DB/Models/user.model.js'
import { generateToken, verifyToken } from '../Utils/tokenFunctions.js'


export const isAuth = (roles) => {

    return async (req, res, next) => {
        try {
            const { authorization } = req.headers
            if (!authorization) {
                return res.status(400).json({ message: 'Please login first' })
            }

            if (!authorization.startsWith('ecommerce__')) {
                return res.status(400).json({ message: 'invalid token prefix' })
            }

            const splitedToken = authorization.split(' ')[1]

            try {
                const decodedData = verifyToken({
                    token: splitedToken,
                    signature: process.env.SIGN_IN_TOKEN_SECRET,
                })

                const findUser = await userModel.findById(
                    decodedData._id,
                    'email userName role')
                if (!findUser) {
                    return res.status(400).json({ message: 'Please SignUp' })
                }
                /// ============================= Authorization ===================
                if (!roles.includes(findUser.role)) {
                    return next(
                        new Error('Unauthorized to access this API', { cause: 401 }),
                    )
                }

                req.authUser = findUser
                return next()
            } catch (error) {

                if (error == 'TokenExpiredError: jwt expired') {

                    const user = await userModel.findOne({ token: splitedToken })

                    if (!user) {
                        return res.status(400).json({ Message: "Wrong Token" })
                    }


                    const userToken = generateToken({
                        payload: { _id: user._id, role: user.role, email: user.email },
                        signature: process.env.SIGN_IN_TOKEN_SECRET,
                        expiresIn: "2d",
                    })

                    if (!userToken) {
                        return next(
                            new Error('token generation fail, payload canot be empty', {
                                cause: 400,
                            }),
                        )
                    }

                    await userModel.findOneAndUpdate(
                        { token: splitedToken },
                        { token: userToken },
                        { new: true }
                    )
                    return res.status(201).json({ Message: "Token is refreshed", newToken: userToken })
                }
                return res.status(400).json({ Message: "In-valid Token" })
            }

        } catch (error) {
            console.log(error);
            next(new Error('Catch error in authentication token layer', { cause: 500 }))
        }
    }
}

export const isAuthQl = async (authorization, roles) => {
    try {
        if (!authorization) {
            return new Error('Please login first', { cause: 400 })
        }

        if (!authorization.startsWith('ecommerce__')) {
            return new Error('invalid token prefix', { cause: 400 })
        }

        const splitedToken = authorization.split(' ')[1]
        try {
            const decodedData = verifyToken({
                token: splitedToken,
                signature: process.env.SIGN_IN_TOKEN_SECRET,
            })
            const findUser = await userModel.findById(
                decodedData._id,
                'email userName role',
            )
            if (!findUser) {
                return new Error('Please SignUp', { cause: 400 })
            }

            //============================== authorization ============

            if (!roles.includes(findUser.role)) {
                return new Error('Unauthorized user', { cause: 401 })
            }

            return {
                code: 200,
                findUser
            }

        } catch (error) {
            // token  => search in db
            if (error == 'TokenExpiredError: jwt expired') {
                // refresh token
                const user = await userModel.findOne({ token: splitedToken })
                if (!user) {
                    return new Error('Wrong token', { cause: 400 })
                }
                // generate new token
                const userToken = generateToken({
                    payload: {
                        email: user.email,
                        _id: user._id,
                    },
                    signature: process.env.SIGN_IN_TOKEN_SECRET,
                    expiresIn: '1h',
                })

                if (!userToken) {
                    return new Error('token generation fail, payload canot be empty', {
                        cause: 400,
                    })
                }
                await userModel.findOneAndUpdate(
                    { token: splitedToken },
                    { token: userToken },
                )
                return res.status(200).json({ message: 'Token refreshed', userToken })
            }
            return new Error('invalid token', { cause: 500 })
        }
    } catch (error) {
        console.log(error)
        new Error('catch error in auth', { cause: 500 })
    }

}