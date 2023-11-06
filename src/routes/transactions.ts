import { FastifyInstance } from 'fastify';
import { knex } from '../database.js';
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { checkSessionIDexists } from '../middlewares/check-session-id-exists.js';
import { request } from 'node:http';

/* Cookies — formas de manter contexto entre requisições */

/* Testes */
/* Unitários: testam exclusivamente uma unidade da aplicação; uma pequena parte de forma isolada, sem contexto; o teste mais rodado porque uma aplicação é formada de vários pedaços menores */
/* De integração: testam a comunicação entre duas ou mais funções */
/* E2E — de ponta a ponta: são testes que simulam um usuário operando na aplicação; fazem todas as ações que um usuário poderia fazer na aplicação */

export async function transactionRoutes(app: FastifyInstance) {
    app.get('/',{preHandler:[checkSessionIDexists]},async (request,reply)=>{
        const { sessionID } = request.cookies
        const transactions = await knex('transactions').where('session_id',sessionID).select()
        return {
            transactions
        }
    })
    app.get('/:id',{preHandler:[checkSessionIDexists]},async (request)=>{
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid()
        })
        const { id } = getTransactionParamsSchema.parse(request.params)
        const { sessionID } = request.cookies
        const transaction = await knex('transactions').where({
            session_id: sessionID,
            id
        }).first()
        return {
            transaction
        }
    })
    app.get('/summary',{preHandler:[checkSessionIDexists]},async (request)=>{
        const { sessionID } = request.cookies
        const summary = await knex('transactions').where('session_id',sessionID).sum('amount',{ as: 'amount' }).first()
        return { summary }
    })
    app.post('/',async(request,reply)=>{
        /* const transactions = await knex('transactions').insert({
            id: crypto.randomUUID(),
            title: 'Transação de teste',
            amount: 1000,
        }).returning('*') */
        /* const search = await knex('transactions').select('*') */
        /* return {transactions,search} */

        /* request.body */
        /* Rquest Body –> de onde vêm as informações que são encriptadas por um protocolo HTTP; servem para criar ou editar algum recurso e vêm no body da requisição */

        const createTransactionBodySchema = z.object({  
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit','debit'])
        })
        const {title,amount,type} = createTransactionBodySchema.parse(request.body) /* Validando os dados do request.body com o schema montado acima; parse verifica se deu certo e só continua a execução do app se não houver erros */
        let sessionID = request.cookies.sessionID
        if(!sessionID) {
            sessionID = randomUUID()
            reply.cookie('sessionID',sessionID,{
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7, /* 7 days */
            })
        }
        await knex('transactions').insert({
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionID
        })
        return reply.status(201).send()
    })
}