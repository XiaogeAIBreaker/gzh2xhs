" Artistic Crimson Aurora (Vim)
hi clear
if exists("syntax_on")
  syntax reset
endif
let g:colors_name = "artistic_crimson_aurora"

hi Normal   guifg=#e5e7eb guibg=#0b0f19 ctermfg=253 ctermbg=234
hi Comment  guifg=#78909C ctermfg=244 gui=italic
hi String   guifg=#EF5350 ctermfg=203
hi Keyword  guifg=#7E57C2 ctermfg=98
hi Identifier guifg=#e5e7eb ctermfg=253

set guifont=Fira\ Code:h14
" For terminals supporting ligatures, configure at terminal level
