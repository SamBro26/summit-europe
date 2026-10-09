/** Delete-account strings. */
export const DELETE_EN = {
  "delAcc.button": "Delete Account",
  "delAcc.title": "Delete your account?",
  "delAcc.body": "Warning: Deleting your account is permanent. This will instantly delete your profile, messages, favorites, and all your published listings. This action cannot be undone.",
  "delAcc.confirm": "Yes, delete permanently",
  "delAcc.success": "Your account has been deleted.",
};

type K = keyof typeof DELETE_EN;
const row = (v: string[]): Record<K, string> =>
  Object.fromEntries((Object.keys(DELETE_EN) as K[]).map((k, i) => [k, v[i]])) as Record<K, string>;

export const DELETE_I18N: Record<string, Record<K, string>> = {
  fr: row(["Supprimer le compte", "Supprimer votre compte ?", "Attention : la suppression de votre compte est définitive. Votre profil, vos messages, vos favoris et toutes vos annonces publiées seront immédiatement supprimés. Cette action est irréversible.", "Oui, supprimer définitivement", "Votre compte a été supprimé."]),
  de: row(["Konto löschen", "Konto löschen?", "Warnung: Das Löschen Ihres Kontos ist endgültig. Ihr Profil, Ihre Nachrichten, Favoriten und alle veröffentlichten Anzeigen werden sofort gelöscht. Dies kann nicht rückgängig gemacht werden.", "Ja, endgültig löschen", "Ihr Konto wurde gelöscht."]),
  it: row(["Elimina account", "Eliminare il tuo account?", "Attenzione: l'eliminazione dell'account è definitiva. Profilo, messaggi, preferiti e tutti gli annunci pubblicati verranno eliminati immediatamente. Questa azione non può essere annullata.", "Sì, elimina definitivamente", "Il tuo account è stato eliminato."]),
  es: row(["Eliminar cuenta", "¿Eliminar tu cuenta?", "Advertencia: eliminar tu cuenta es permanente. Se borrarán al instante tu perfil, mensajes, favoritos y todos tus anuncios publicados. Esta acción no se puede deshacer.", "Sí, eliminar definitivamente", "Tu cuenta ha sido eliminada."]),
  pt: row(["Eliminar conta", "Eliminar a sua conta?", "Aviso: eliminar a sua conta é permanente. O seu perfil, mensagens, favoritos e todos os anúncios publicados serão apagados de imediato. Esta ação não pode ser anulada.", "Sim, eliminar permanentemente", "A sua conta foi eliminada."]),
  nl: row(["Account verwijderen", "Je account verwijderen?", "Waarschuwing: het verwijderen van je account is definitief. Je profiel, berichten, favorieten en al je gepubliceerde advertenties worden direct verwijderd. Dit kan niet ongedaan worden gemaakt.", "Ja, definitief verwijderen", "Je account is verwijderd."]),
  el: row(["Διαγραφή λογαριασμού", "Διαγραφή του λογαριασμού σας;", "Προειδοποίηση: Η διαγραφή του λογαριασμού σας είναι οριστική. Το προφίλ, τα μηνύματα, τα αγαπημένα και όλες οι δημοσιευμένες αγγελίες σας θα διαγραφούν αμέσως. Αυτή η ενέργεια δεν αναιρείται.", "Ναι, οριστική διαγραφή", "Ο λογαριασμός σας διαγράφηκε."]),
  ga: row(["Scrios an cuntas", "An bhfuil tú chun do chuntas a scriosadh?", "Rabhadh: Is buan é do chuntas a scriosadh. Scriosfar do phróifíl, do theachtaireachtaí, do roghanna agus do chuid fógraí foilsithe láithreach. Ní féidir é seo a chealú.", "Is ea, scrios go buan", "Scriosadh do chuntas."]),
  fi: row(["Poista tili", "Poistetaanko tilisi?", "Varoitus: Tilin poistaminen on pysyvää. Profiilisi, viestisi, suosikkisi ja kaikki julkaistut ilmoituksesi poistetaan välittömästi. Toimintoa ei voi perua.", "Kyllä, poista pysyvästi", "Tilisi on poistettu."]),
  et: row(["Kustuta konto", "Kas kustutada konto?", "Hoiatus: konto kustutamine on lõplik. Sinu profiil, sõnumid, lemmikud ja kõik avaldatud kuulutused kustutatakse kohe. Seda ei saa tagasi võtta.", "Jah, kustuta jäädavalt", "Sinu konto on kustutatud."]),
  lv: row(["Dzēst kontu", "Dzēst jūsu kontu?", "Brīdinājums: konta dzēšana ir neatgriezeniska. Jūsu profils, ziņas, izlase un visi publicētie sludinājumi tiks nekavējoties dzēsti. Šo darbību nevar atsaukt.", "Jā, dzēst neatgriezeniski", "Jūsu konts ir dzēsts."]),
  lt: row(["Ištrinti paskyrą", "Ištrinti paskyrą?", "Įspėjimas: paskyros ištrynimas yra negrįžtamas. Jūsų profilis, žinutės, mėgstami ir visi paskelbti skelbimai bus iškart ištrinti. Šio veiksmo atšaukti negalima.", "Taip, ištrinti visam laikui", "Jūsų paskyra ištrinta."]),
  mt: row(["Ħassar il-kont", "Tħassar il-kont tiegħek?", "Twissija: It-tħassir tal-kont huwa permanenti. Il-profil, il-messaġġi, il-favoriti u r-reklami kollha ppubblikati tiegħek jitħassru minnufih. Din l-azzjoni ma tistax titreġġa' lura.", "Iva, ħassar b'mod permanenti", "Il-kont tiegħek tħassar."]),
  sk: row(["Odstrániť účet", "Odstrániť váš účet?", "Upozornenie: Odstránenie účtu je trvalé. Váš profil, správy, obľúbené a všetky zverejnené inzeráty budú okamžite odstránené. Túto akciu nie je možné vrátiť.", "Áno, natrvalo odstrániť", "Váš účet bol odstránený."]),
  sl: row(["Izbriši račun", "Želite izbrisati račun?", "Opozorilo: Izbris računa je trajen. Vaš profil, sporočila, priljubljeni in vsi objavljeni oglasi bodo takoj izbrisani. Tega dejanja ni mogoče razveljaviti.", "Da, trajno izbriši", "Vaš račun je bil izbrisan."]),
  bg: row(["Изтрий акаунта", "Да изтрием ли акаунта ви?", "Внимание: Изтриването на акаунта е окончателно. Профилът, съобщенията, любимите и всички ваши публикувани обяви ще бъдат изтрити незабавно. Това действие не може да бъде отменено.", "Да, изтрий окончателно", "Акаунтът ви беше изтрит."]),
  sv: row(["Radera konto", "Radera ditt konto?", "Varning: Att radera ditt konto är permanent. Din profil, dina meddelanden, favoriter och alla publicerade annonser raderas direkt. Detta kan inte ångras.", "Ja, radera permanent", "Ditt konto har raderats."]),
  tr: row(["Hesabı sil", "Hesabınız silinsin mi?", "Uyarı: Hesabınızı silmek kalıcıdır. Profiliniz, mesajlarınız, favorileriniz ve yayınlanan tüm ilanlarınız anında silinecektir. Bu işlem geri alınamaz.", "Evet, kalıcı olarak sil", "Hesabınız silindi."]),
  lb: row(["Kont läschen", "Äre Kont läschen?", "Warnung: D'Läsche vun Ärem Kont ass definitiv. Äre Profil, Är Messagen, Favoritten an all Är publizéiert Annoncë ginn direkt geläscht. Dëst kann net réckgängeg gemaach ginn.", "Jo, definitiv läschen", "Äre Kont gouf geläscht."]),
  ca: row(["Elimina el compte", "Vols eliminar el teu compte?", "Avís: eliminar el compte és permanent. El teu perfil, missatges, preferits i tots els anuncis publicats s'esborraran a l'instant. Aquesta acció no es pot desfer.", "Sí, elimina definitivament", "El teu compte s'ha eliminat."]),
  hr: row(["Izbriši račun", "Izbrisati vaš račun?", "Upozorenje: Brisanje računa je trajno. Vaš profil, poruke, favoriti i svi objavljeni oglasi bit će odmah izbrisani. Ova se radnja ne može poništiti.", "Da, trajno izbriši", "Vaš račun je izbrisan."]),
};
