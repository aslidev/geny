import { parseHeaderOptions } from './tools'
import * as ejs from 'ejs'
import * as Eta from "eta"


import * as changeCase from "change-case"

test('EJS', () => {

  /* const x = Eta.render('__$users__', {users: 'X'},
  {useWith: true, tags: ['__', '__'], parse: {interpolate: '$'}}) 
  console.log(x) */

  /* const x = ejs.render('<_=users_>', {users: 'X'},
  {delimiter: '_'}) 
  console.log(x); */
})

test('getExtendsTree', () => {

  console.dir(changeCase['camelCase']);

})

test('parseHeaderOptions', () => {
  const { fileOptions, content } = parseHeaderOptions(`
  //@test1:{"r": 51}
     //@test2:{"r2": 52}
//@test3:true

qsdqsfqf
  
  `)
  console.dir(fileOptions);
  console.dir(content);

})

test('testRegex', () => {
  const content = `@test1:{"r": 51}
    @test2:{"r2": 52}
@test3:true

qsdqsfqf
  
  `.replaceAll(/\%^@([a-zA-Z0-9_-]+)(?:\s*:\s*([^\n]+))?.*\n?/gm, (match, name, data) => {
    console.dir(name);
    console.dir(data);
    return ''
  })

  console.log(content);

})