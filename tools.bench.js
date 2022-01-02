import * as b from 'benny'
import * as ejs from 'ejs'
import * as Eta from "eta"
import { template } from 'lodash-es'
import Expand from 'expand-template'
const expand = Expand({ sep: '____' })

b.suite(
    'Templates',

    b.add('Expand', () => {
        const x = expand('__users__', { users: 'X'})
    }),

    b.add('Lodash', () => {
        const x = template('__users__', { interpolate: /__([\s\S]+?)__/g })({ users: 'X' })
    }),

    b.add('EJS', () => {
        const x = ejs.render('<_=users_>', { users: 'X' },
            { delimiter: '_' })
    }),

    b.add('ETA', () => {
        const x = Eta.render('__$users__', { users: 'X' },
            { useWith: true, tags: ['__', '__'], parse: { interpolate: '$' } })
    }),

    b.cycle(),
    b.complete(),
)