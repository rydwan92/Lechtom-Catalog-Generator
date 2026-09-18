# LECHTOM Catalog Generator

Wewnętrzna aplikacja Windows do układania katalogów A4 z produktów Comarch ERP XL i eksportu PDF. Pierwsza iteracja obejmuje lokalne katalogi, szablon okładki, spis treści, siatki 12/16 produktów, przeglądarkę produktów ERP, media, QR oraz konfigurację połączenia.

## Uruchomienie

Wymagany Node.js 22.12+ i Windows 10/11.

```powershell
npm install
npm run dev
```

`npm install` automatycznie przebudowuje natywne `better-sqlite3` dla Electron. Jeśli środowisko ma ustawioną zmienną `ELECTRON_RUN_AS_NODE`, usuń ją w bieżącej sesji przed `npm run dev`.

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm run dev
```

Weryfikacja i instalator Windows:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run dist:win
```

Instalator NSIS znajduje się w `dist/`. Baza, media i eksporty znajdują się w katalogu `app.getPath('userData')` użytkownika Windows. Migracje SQLite uruchamiają się przy starcie aplikacji.

## Architektura

- `src/main/db/sqlite/`: lokalny model Drizzle i repozytorium katalogów; migracje w `drizzle/`.
- `src/main/integrations/erp/`: wyłącznie odczyt z SQL Server, z zamkniętą listą zapytań.
- `src/main/ipc/`: walidowane operacje IPC, bez kanału do dowolnego SQL.
- `src/main/services/`: media, QR i eksport PDF.
- `src/preload/`: jawne `window.lechtom`.
- `src/domain/`, `src/shared/`: model domenowy, typy i walidacja Zod.
- `src/renderer/`: widoki React i wspólny `CatalogPageRenderer` używany w edytorze i PDF.

SQLite ma 10 tabel: `catalogs`, `catalog_pages`, `catalog_page_items`, `page_templates`, `manufacturer_presentations`, `product_presentations`, `media_assets`, `qr_codes`, `contact_locations`, `catalog_settings`. Produkty ERP nie są kopiowane do SQLite. `product_presentations` łączy przyszłe dane prezentacyjne z produktem po parze `erp_gid_numer`, `erp_gid_typ`.

## ERP i bezpieczeństwo

Połączenie `mssql` działa tylko w procesie main. Renderer ma `contextIsolation: true`, `nodeIntegration: false` i preload z konkretnymi metodami. IPC sprawdza okno źródłowe i waliduje dane wejściowe przez Zod. Hasło konfiguracji jest szyfrowane przez Electron `safeStorage` i zapisywane poza SQLite; nie jest zwracane rendererowi po odczycie konfiguracji.

Jedyny executor przyjmuje nazwę jednego z przygotowanych SELECT-ów. Używane zapytania:

```sql
SELECT 1 AS ConnectionOk, DB_NAME() AS DatabaseName, @@SERVERNAME AS ServerName

SELECT Twr_GIDNumer, Twr_GIDTyp, Twr_Kod, Twr_Nazwa, Twr_Jm, Twr_StawkaPodSpr
FROM CDN.TwrKarty
WHERE (@query = '' OR Twr_Kod LIKE @pattern ESCAPE '\' OR Twr_Nazwa LIKE @pattern ESCAPE '\')
ORDER BY Twr_Kod OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY

SELECT COUNT_BIG(1) AS Total FROM CDN.TwrKarty
WHERE (@query = '' OR Twr_Kod LIKE @pattern ESCAPE '\' OR Twr_Nazwa LIKE @pattern ESCAPE '\')

SELECT Twr_GIDNumer, Twr_GIDTyp, Twr_Kod, Twr_Nazwa, Twr_Jm, Twr_StawkaPodSpr
FROM CDN.TwrKarty WHERE Twr_GIDNumer = @gidNumer AND Twr_GIDTyp = @gidTyp
```

Wartości użytkownika są przekazywane jako parametry `mssql`. Kod nie wykonuje żadnych zapisów do ERP. Docelowe konto SQL Server musi otrzymać wyłącznie uprawnienia SELECT do niezbędnych obiektów.

**Ograniczenie schematu:** w dostarczonym workspace nie ma definicji `B2B.GetGoods` ani `B2B.GetGoodsByGroup`, ani dostępu do firmowej bazy. EAN, producent, kategoria, stan, waga i przelicznik dodatkowej jednostki pozostają `null`; filtry producenta i kategorii są wyłączone. Po otrzymaniu definicji funkcji należy sprawdzić mapowanie do `CDN.TwrJm` i pozostałych źródeł, a potem dodać wyłącznie wymagane kolumny i JOIN-y. Produkty o jednostce bazowej `kg` zachowują `kg`, dopóki nie ma zweryfikowanego przelicznika.

## Kolejne kroki

1. Zweryfikować definicje funkcji B2B i konto SQL tylko do odczytu w środowisku firmy.
2. Uzupełnić mapowanie EAN, producenta, kategorii, stanów, wag i jednostek.
3. Dodać zarządzanie prezentacją produktów i producentów oraz przypinanie mediów/QR do slotów.
4. Rozwinąć edytor o pozostałe szablony, automatyczne generowanie stron i kontakty.
5. Przetestować eksport wielostronicowych katalogów i wydruk na docelowych stanowiskach.
