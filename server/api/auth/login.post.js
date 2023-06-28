import { getUserByUsername } from "../../db/users"
import bcrcypt from "bcrypt"
import { generateTokens, sendRefreshToken } from "../../utils/jwt"
import { userTransformer } from "../../transformers/user"
import { createRefreshToken } from "../../db/refreshTokens"

export default defineEventHandler(async (event) => { 
	const body = await readBody(event)

	const { username, password } = body

	if (!username || !password) {
		return sendError(event, createError({
			statusCode: 400, statusMessage: 'Invalid params'
		}))
	}

	const user = await getUserByUsername(username)

	if (!user) {
		return sendError(event, createError({
			statusCode: 400, statusMessage: 'Username or password is invalid'
		}))
	}

	const passwordMatch = await bcrcypt.compare(password, user.password)
	
	if (!passwordMatch) {
		return sendError(event, createError({
			statusCode: 400, statusMessage: 'Username or password is invalid'
		}))
	}

	const { accessToken, refreshToken } = generateTokens(user)

	await createRefreshToken({
		token: refreshToken,
		userId: user.id
	})

	sendRefreshToken(event, refreshToken)

	return {
		access_token: accessToken,
		user: userTransformer(user)
	}
})
