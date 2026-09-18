const columns = 'Id, Kod, Nazwa, Typ, Grupa, Marka, Vat, EAN, Jm, JmDodatkowa, PrzeliczL, PrzeliczM, Kategoria, UrlImage'
const source = 'FROM B2B.GetOfferGoods()'
const filter = "WHERE (@query = '' OR Kod LIKE @pattern ESCAPE '\\' OR Nazwa LIKE @pattern ESCAPE '\\' OR EAN LIKE @pattern ESCAPE '\\') AND (@brand = '' OR Marka = @brand) AND (@category = '' OR Kategoria = @category) AND (@type = '' OR Typ = @type)"
export const productQueries = {
  products: `SELECT ${columns} ${source} ${filter} ORDER BY Kod, Id OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  productCount: `SELECT COUNT_BIG(1) AS Total ${source} ${filter}`,
  productById: `SELECT ${columns} ${source} WHERE Id = @gidNumer`,
  brands: `SELECT DISTINCT Marka AS Value ${source} WHERE Marka IS NOT NULL AND Marka <> '' ORDER BY Value`,
  categories: `SELECT DISTINCT Kategoria AS Value ${source} WHERE Kategoria IS NOT NULL AND Kategoria <> '' ORDER BY Value`,
  types: `SELECT DISTINCT Typ AS Value ${source} WHERE Typ IS NOT NULL AND Typ <> '' ORDER BY Value`
} as const
