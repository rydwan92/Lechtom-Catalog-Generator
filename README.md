# LECHTOM Catalog Generator

Desktopowy edytor katalogów A4 dla LECHTOM. Produkty są czytane z Comarch ERP XL, a projekty są zapisywane jako pliki JSON. Aplikacja nie używa lokalnej bazy SQL.

## Uruchomienie

Wymagane: Node.js 22.12+ i Windows 10/11.

```powershell
npm install
npm run dev
```

Weryfikacja:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run test:pdf
```

Jeżeli bieżąca sesja ma ustawione `ELECTRON_RUN_AS_NODE`, usuń tę zmienną przed `npm run dev` lub `npm run test:pdf`: `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

Instalator Windows: `npm run dist:win`.

## Projekty i zasoby

Domyślny katalog danych to `Documents/LECHTOM Catalog Generator/`:

```text
library/
  brands/          logotypy
  backgrounds/     tła i grafiki całych stron
  products/        inne grafiki
  brands.json      opcjonalne aliasy nazwa marki → nazwa pliku
  assets.json      indeks importowanych grafik
  qr.json          zapisane kody QR
projects/
  <uuid>/
    project.json
    assets/
exports/
```

Folder `projects` można zmienić w Ustawieniach, również na folder sieciowy. Konfiguracja folderu i zaszyfrowane hasło ERP znajdują się w `app.getPath('userData')`. Hasło jest szyfrowane przez Electron `safeStorage`.

`project.json` ma `schemaVersion: 1`, identyfikator, nazwę, daty utworzenia i aktualizacji, zakres ważności, ustawienia A4 oraz uporządkowaną listę stron. Każdy produkt na stronie zawiera identyfikator ERP, migawkę danych produktu i `customData` na ręczne nadpisania. Podgląd i PDF korzystają z migawki, więc otwarcie katalogu nie wymaga bieżącego połączenia z ERP. Plik jest walidowany przez Zod i zapisywany przez `project.json.tmp` → `project.json`.

Nowy katalog ma cztery stałe strony: przygotowaną okładkę, spis treści, reklamę ezamshop i stronę oddziałów, telefonów oraz marek. Strony produktów 12/16 są dodawane pomiędzy spisem treści a reklamą. Grafikę okładki, reklamy, tło i logo można wybrać w edytorze. Dane kontaktowe można wpisać ręcznie; żadnych danych oddziałów nie pobieramy jeszcze z ERP. Spis treści i lista marek wynikają ze stron produktów.

Po wybraniu marki aplikacja szuka logotypu w `library/brands/` według znormalizowanej nazwy pliku lub aliasu z `brands.json`. Logo można nadpisać dla danej strony. Projekt można też zduplikować z listy katalogów.

## ERP

Połączenie `mssql` istnieje wyłącznie w procesie Electron main. Renderer wywołuje konkretne metody IPC; nie ma dostępu do connection stringa ani do dowolnego SQL. Dostęp do ERP jest tylko do odczytu. Używane zapytania to:

```sql
SELECT 1 AS ConnectionOk, DB_NAME() AS DatabaseName, @@SERVERNAME AS ServerName

SELECT Id, Kod, Nazwa, Typ, Grupa, Marka, Vat, EAN, Jm, JmDodatkowa,
       PrzeliczL, PrzeliczM, Kategoria, UrlImage
FROM B2B.GetOfferGoods()
WHERE (@query = '' OR Kod LIKE @pattern ESCAPE '\' OR Nazwa LIKE @pattern ESCAPE '\' OR EAN LIKE @pattern ESCAPE '\')
  AND (@brand = '' OR Marka = @brand)
  AND (@category = '' OR Kategoria = @category)
  AND (@type = '' OR Typ = @type)
ORDER BY Kod, Id OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY

SELECT COUNT_BIG(1) AS Total FROM B2B.GetOfferGoods()
WHERE (@query = '' OR Kod LIKE @pattern ESCAPE '\' OR Nazwa LIKE @pattern ESCAPE '\' OR EAN LIKE @pattern ESCAPE '\')
  AND (@brand = '' OR Marka = @brand)
  AND (@category = '' OR Kategoria = @category)
  AND (@type = '' OR Typ = @type)

SELECT Id, Kod, Nazwa, Typ, Grupa, Marka, Vat, EAN, Jm, JmDodatkowa,
       PrzeliczL, PrzeliczM, Kategoria, UrlImage
FROM B2B.GetOfferGoods() WHERE Id = @gidNumer

SELECT DISTINCT Marka AS Value FROM B2B.GetOfferGoods() WHERE Marka IS NOT NULL AND Marka <> '' ORDER BY Value
SELECT DISTINCT Kategoria AS Value FROM B2B.GetOfferGoods() WHERE Kategoria IS NOT NULL AND Kategoria <> '' ORDER BY Value
SELECT DISTINCT Typ AS Value FROM B2B.GetOfferGoods() WHERE Typ IS NOT NULL AND Typ <> '' ORDER BY Value
```

Zapytania są stałe, a wartości filtrów parametryzowane. Kod nie wykonuje wobec ERP `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `EXEC` ani DDL. Plik `SQL ERP` jest tylko dokumentacją istniejącej funkcji i nigdy nie jest wykonywany. `CenaZakupu` oraz `Cena100` nie są pobierane. Docelowe konto SQL powinno mieć tylko uprawnienia odczytu do funkcji.

## Ograniczenia obecnej iteracji

- Połączenia z firmowym ERP nie da się sprawdzić bez konfiguracji i dostępu do serwera. Funkcja `B2B.GetOfferGoods()` musi już istnieć w bazie.
- Stare dane aplikacji w SQLite pozostają na dysku użytkownika, ale nowy format nie importuje ich automatycznie. Przed użyciem na stanowisku z istniejącymi katalogami potrzebna będzie jednorazowa migracja.
- Zdjęcia produktów z ERP są ładowane z `UrlImage` podczas podglądu i eksportu. Aby mieć pełny eksport offline, trzeba je później skopiować do `assets/` projektu.
- Składka drukarska i wyrównanie liczby stron do wielokrotności czterech wymagają osobnej weryfikacji z drukarnią. PDF eksportuje strony A4 w kolejności katalogu.
