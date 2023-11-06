/* d.ts é um arquivo de definição de tipos */
/* aqui não há código JavaScript, só TypeScript */

import { Knex } from 'knex'
declare module 'knex/types/tables' {
    export interface Tables {
        transactions: {
            id: string,
            title: string,
            amount: number,
            created_at: string,
            session_id?: string
        }
    }
}