/* DISTRICT ADMINISTRATION. Every district shows its responsible official's designation. No officer names are held in this prototype. */
const ADMIN_TITLE='District Health Officer';
const adminHTML=(st,d)=>`<div class="adm"><b>${ADMIN_TITLE}</b><span>District Health Office, ${esc(d)}, ${esc(SM[st].n)}</span><span>Officer name: not provided</span></div>`;
