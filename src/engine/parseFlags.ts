import { ResultFlag } from "./lemmatizer"

function loadTableToMap(table: string): Map<string, string> {
	return new Map(table.split("\n").map(line => line.trim()).filter(line => line).map(line => line.split(/\t+/)).map(line=>[line[0], line[1]]))
}

const flagGroups: Map<string, string> = loadTableToMap(`
contr			?
iterative		?
long_pen		?
needs_acc		?
parad_form		?
r_e_i_alpha		?
short_pen		?
short_subj		?
stem_acc		?
suff_acc		?
syncope			?
unaugmented		?
uncontr			?
acc				case
dat				case
gen				case
nom				case
nom/acc			case
nom/voc/acc		case
nom/voc			case
voc				case
ami_aor			conj
ami_pr			conj
ami_short		conj
w_stem			conj
a_hs			decl
ah_ahs			decl
ah_hs			decl
aos_aou			decl
ar_atos			decl
art_adj			decl
as_a			decl
as_aina_an		decl
as_antos		decl
as_aos			decl
as_asa_an		decl
as_atos			decl
c_ggos			decl
c_gos			decl
c_kos			decl
c_ktos			decl
c_xos			decl
eh_ehs			decl
ehs_eou			decl
eis_enos		decl
eis_essa		decl
eos_eh_eon		decl
eos_eou			decl
eus_ews			decl
ew_ewnos		decl
ewn_ewnos		decl
gc_gos			decl
h_hs			decl
hc_ekos			decl
heis_hessa		decl
hn_eina_en		decl
hn_enos			decl
hr_eros			decl
hr_ros			decl
hs_entos		decl
hs_eos			decl
hs_es			decl
hs_ou			decl
is_ews			decl
is_iCdos		decl
is_idos			decl
is_idos_adj		decl
is_ios			decl
is_itos			decl
is_itos_adj		decl
klehs_kleous	decl
ma_matos		decl
n_nos			decl
n_nos_adj		decl
n_ntos			decl
oeis_oentos		decl
oeis_oessa		decl
oos_oh_oon		decl
oos_oon			decl
oos_oou			decl
os_h_on			decl
os_on			decl
os_ou			decl
ous_ontos		decl
ow_pr			decl
pous_podos		decl
qric_trixos		decl
r_ros			decl
r_rtos			decl
r_tos			decl
s_dos			decl
s_nos			decl
s_ntos			decl
s_os			decl
s_qos			decl
s_ros			decl
s_tos			decl
t_tos			decl
uLs_uos			decl
us_eia_u		decl
us_ews			decl
us_u			decl
us_uos			decl
us_uos2			decl
verb_adj		decl
verb_adj1		decl
verb_adj2		decl
vh_vhs			decl
w_oos			decl
wCn_wCntos		decl
wn_nos			decl
wn_on			decl
wn_on_comp		decl
wn_onos			decl
wn_ontos		decl
wn_ousa_on		decl
wr_oros			decl
ws_oos			decl
ws_w			decl
ws_w_long		decl
ws_wn			decl
ws_wn_long		decl
ws_wos			decl
ww_pr			decl
y_bos			decl
y_fos			decl
y_pos			decl
comp			degree
superl			degree
aeolic			dialect
attic			dialect
doric			dialect
epic			dialect
homeric			dialect
ionic			dialect
late			dialect
later			dialect
poetic			dialect
prose			dialect
fem				gender
masc			gender
masc/fem		gender
neut			gender
neuter			gender
comp_only		misc
not_in_comp		misc
pers_name		misc
ind				mood
opt				mood
subj			mood
dual			number
pl				number
sg				number
adv				partOfSpeech
adverbial		partOfSpeech
imperat			partOfSpeech
inf				partOfSpeech
part			partOfSpeech
perf_act		partOfSpeech+tense+voice
perf2_act		partOfSpeech+tense+voice
perfp_d			partOfSpeech+tense+voice
perfp_g			partOfSpeech+tense+voice
perfp_gg		partOfSpeech+tense+voice
perfp_gx		partOfSpeech+tense+voice
perfp_l			partOfSpeech+tense+voice
perfp_mp		partOfSpeech+tense+voice
perfp_n			partOfSpeech+tense+voice
perfp_p			partOfSpeech+tense+voice
perfp_r			partOfSpeech+tense+voice
perfp_s			partOfSpeech+tense+voice
perfp_un		partOfSpeech+tense+voice
perfp_v			partOfSpeech+tense+voice
perfp_vow		partOfSpeech+tense+voice
1st				person
2nd				person
3rd				person
ajw_pr			tense
aor				tense
aor1			tense
aor2			tense
ath_h_aor		tense
ath_primary		tense
ath_secondary	tense
ath_u_aor		tense
ath_w_aor		tense
aw_fut			tense
aw_pr			tense
emi_aor			tense
emi_pr			tense
evw_pr			tense
ew_fut			tense
ew_pr			tense
fut				tense
fut_perf		tense
futperf			tense
imperf			tense
omi_aor			tense
omi_pr			tense
perf			tense
plup			tense
pres			tense
reg_fut			tense
umi_pr			tense
aor_pass		tense+voice
aor2_pass		tense+voice
act				voice
mid				voice
mp				voice
pass			voice

`)

const longFlags = loadTableToMap(`
nom			nominative
gen			genitive
dat			dative
acc			accusative
voc			vocative
pres		present
imperf		imperfect
fut			future
fut_perf	future perfect
futperf		future perfect
plup		pluperfect
perf		perfect
act			active
mid			middle
mp			middle-passive
pass		passive
aor			aorist
ind			indicative
opt			optative
subj		subjunctive
pl			plural
sg			singular
imperat		imperative
masc		masculine
fem			feminine
neut		neuter
comp		comparative
superl		superlative
adv				adverb
inf				infinitive
part			participle
1st			1st person
2nd			2nd person
3rd			3rd person

`)

const shortFlags = loadTableToMap(`
1st		1st pers
2nd		2nd pers
3rd		3rd pers
masc/fem	m/f
masc		m
fem			f
`)

export function parseFlag(flag: string): ResultFlag {
	const group = flagGroups.get(flag) ?? "?"
	let long = longFlags.get(flag) ?? flag
	if (long === flag && flag.includes("/")) {
		const splitMapped = flag.split("/").map(sub => longFlags.get(sub))
		if (!splitMapped.includes(undefined)) {
			long = splitMapped.join("/")
		}
	}
	let short = shortFlags.get(flag) ?? flag

	return {group, long, short}
}

const standardGroupOrdering = ["person", "case", "gender", "number",  "tense", "voice", "mood", "decl", "conj", "degree", "partOfSpeech"]

export function sortFlags(flags: ResultFlag[]) {
	flags.sort((a,b)=>{
		let aI = standardGroupOrdering.indexOf(a.group)
		if (aI === -1) {
			aI = standardGroupOrdering.length
		}
		let bI =  standardGroupOrdering.indexOf(b.group)
		if (bI === -1) {
			bI = standardGroupOrdering.length
		}
		return aI-bI
	})
}

export const standardDetailFlagsDisplayGroups = ["dialect"]
