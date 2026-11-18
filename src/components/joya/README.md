# Joya Design System — customer-web

Même langage visuel que **joya-energy.com** (handoff `_handoff-tokens.scss`).

```
src/styles/joya-tokens.css   → tokens CSS (--joya-*)
tailwind.config.js            → thème Tailwind branché sur les tokens
src/components/ui/*           → primitives (Button, Card, Input, Select, Badge, Tabs, Table, Dialog, Drawer, Alert, Tooltip, Skeleton, Toaster)
src/components/joya/*         → composants Joya (ce dossier)
feature components → pages
```

## Couleurs (Tailwind)

| Rôle | Classes |
|---|---|
| Action principale | `bg-coral` `hover:bg-coral-dark` · tints `coral-tint` `coral-soft` `coral-wash` |
| Texte / surfaces sombres | `text-navy` `bg-navy` `navy-dark` `navy-deep` |
| Accent secondaire / info | `blue` `blue-tint` `blue-soft` `blue-light` |
| Fond de page | `bg-cream` · `cream-2` |
| Bordures | `border-line` `border-line-strong` |
| Texte secondaire | `text-ink-muted` `text-ink-faint` |
| Statuts | `success` `warning` `danger` (+ `-soft`, `-strong`) · `sun` (irradiation uniquement) |

`slate-*` / `gray-*` sont remappés sur une échelle neutre teintée navy.
Tous les tokens acceptent l'opacité : `bg-coral/10`, `ring-landing-primary/30`.
**Ne pas écrire de hex dans les composants.** Pour SVG/Recharts : `JOYA_CHART` / `JOYA_RECHARTS`.

## Typographie

| Usage | Classe |
|---|---|
| Titre de page | `font-display text-page-title` (Archivo 700) |
| Titre de section | `text-section-title` |
| Titre de carte | `text-card-title` |
| KPI | `joya-kpi-value text-kpi` / `text-kpi-lg` |
| Eyebrow / labels techniques | `joya-eyebrow`, `font-data` (IBM Plex Mono) |
| Corps / UI | Inter (défaut) |

`h1–h4` sont en Archivo par défaut. `cn()` connaît ces tailles (tailwind-merge étendu).

## Rayons, ombres, motion

- `rounded-md` 10 · `rounded-lg` 14 · `rounded-xl` 18 · `rounded-2xl` 22 · `rounded-3xl` 28 · `rounded-pill`
- `shadow-joya-xs|sm|md|lg|coral` (ombres teintées navy, jamais noires)
- `ease-joya` (cubic-bezier(.16,1,.3,1)), `duration-fast|base|slow`
- `joya-page-enter`, `joya-stagger`, `joya-skeleton` — désactivés sous `prefers-reduced-motion`

## Composants Joya

| Composant | Rôle |
|---|---|
| `JoyaLogo` | Logo officiel (`full` / `mark`) |
| `JoyaPageHeader` | Eyebrow + titre + description + actions + meta (1 par page) |
| `JoyaSectionHeader` | Titre de section, variante numérotée « 01 » (rapports) |
| `JoyaEyebrow` | Label Plex Mono avec pastille coral |
| `JoyaKpiCard` / `JoyaTrend` | KPI (variants `default` `hot` `tint` `navy`), puce de tendance |
| `JoyaChartCard` / `JoyaLegendItem` | Cadre standard des graphiques |
| `JoyaStatusBadge` | Statut équipement/dossier (point + texte, jamais couleur seule) |
| `JoyaSegmented` | Sélecteur de période / vue (radiogroup clavier) |
| `JoyaInfoList` / `JoyaInfoRow` | Données « libellé → valeur » |
| `JoyaEmptyState` / `JoyaErrorState` / `JoyaLoadingState` | États UI |

## Boutons

`<Button>` = pill coral. Variantes : `navy`, `outline`, `secondary`, `soft`, `ghost`,
`destructive`, `destructive-outline`, `link`. Prop `loading`. CTA signature landing :

```tsx
<Button className="pr-2.5">Continuer <ButtonPuck /></Button>
```
