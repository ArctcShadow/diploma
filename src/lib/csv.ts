import { parserInput }      from 'fruitsconfits/modules/lib/types';
import { getStringParsers } from 'fruitsconfits/modules/lib/string-parser';



type Ctx = undefined;
type Ast = string | string[];

//фабрика парсерів рядків
const $s = getStringParsers<Ctx, Ast>({
    rawToToken: rawToken => rawToken,
    concatTokens: tokens => (tokens.length ?
        [tokens.reduce((a, b) => a as string + b as string)] : []),
});

const {seq, cls, notCls, classes, cat,
        repeat, end, first, combine, erase, trans, ahead} = $s;

//парсинг рядків через кому для підтримки формату CSV окремих елементыв
const quoted = trans(input => input.length ? input : [''])(
    erase(repeat(classes.spaceWithinSingleLine), cls('"')),
    cat(repeat(first(
        trans(input => ['"'])(seq('""')),
        notCls('"'),
    ))),
    erase(cls('"'), repeat(erase(classes.spaceWithinSingleLine))),);

const nakid = trans(input => input.length ? input : [''])(
    erase(repeat(classes.spaceWithinSingleLine)),
    cat(repeat(first(
        erase(classes.spaceWithinSingleLine, ahead(cls(',', '\r\n', '\n', '\r'))),
        notCls(',', '\r\n', '\n', '\r'),
    ))),);

const cell = first(quoted, nakid);

const row = trans(input => [input as string[]])(
    cell,
    repeat(combine(erase(seq(',')), cell)),);

const rows = combine(
    row,
    repeat(combine(erase(classes.newline), row)),
    end(),);

// функція повернення представлення тексту масивом масивів
export function parse(s: string) {
    const z = rows(parserInput(s));
    if (! z.succeeded) {
        throw new Error(z.message);
    }
    return z.tokens as string[][];
}
