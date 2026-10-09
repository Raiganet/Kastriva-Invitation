/** Keep every numbered migration explicitly covered; reject unreviewed new files. */
import contract from '../data/database-contract.json' with {type:'json'};
export function sqlTestPlan(actualNames) {
 const expected=[...contract.migrations];
 if(!Array.isArray(actualNames)||actualNames.length!==expected.length
   || [...actualNames].sort().some((name,index)=>name!==expected[index])) {
  throw new Error('Migration files differ from data/database-contract.json. Update the reviewed plan; no database was touched.');
 }
 const m=name=>'supabase/migrations/'+name, t=name=>'supabase/tests/'+name;
 return [t('local-bootstrap.sql'),...expected.slice(0,6).map(m),
  ...['003_editor_validation.sql','004_commerce_integration.sql','005_guestbook_integration.sql','006_cms_integration.sql'].map(t),
  m(expected[6]),t('007_release_integration.sql'),m(expected[6]),t('007_release_integration.sql'),
  t('008_011_upgrade_seed.sql'),
  ...expected.slice(7,11).map(m),
  t('008_011_upgrade_verify.sql'),
  t('011_replay_snapshot.sql'),m(expected[10]),t('011_replay_verify.sql'),
  m(expected[11]),t('012_feature_readiness.sql'),
  m(expected[11]),t('012_feature_readiness.sql'),t('008_011_upgrade_verify.sql'),t('011_replay_verify.sql'),
  m(expected[12]),t('013_public_wishes.sql'),m(expected[12]),t('013_public_wishes.sql'),
  m(expected[13]),t('014_public_wishes_auto_publish.sql'),m(expected[13]),t('014_public_wishes_auto_publish.sql'),
  m(expected[14]),t('015_public_wishes_readiness.sql'),m(expected[14]),t('015_public_wishes_readiness.sql'),
  m(expected[15]),t('016_aurora_premium_music.sql'),m(expected[15]),t('016_aurora_premium_music.sql'),
  m(expected[16]),t('017_music_volume.sql'),m(expected[16]),t('017_music_volume.sql'),
  m(expected[17]),t('018_imported_music.sql'),m(expected[17]),t('018_imported_music.sql'),
  t('019_occasion_seed.sql'),m(expected[18]),t('019_occasion_verify.sql'),
  m(expected[18]),t('019_occasion_verify.sql'),
  t('020_premium_seed.sql'),m(expected[19]),t('020_premium_verify.sql'),
  m(expected[19]),t('020_premium_verify.sql'),
  m(expected[20]),t('021_non_wedding_orders.sql'),
  m(expected[20]),t('021_non_wedding_orders.sql'),
 ];
}
