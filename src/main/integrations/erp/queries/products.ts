// Only columns explicitly named in the supplied ERP brief. Extend after verifying the live schema/functions.
export const PRODUCT_COLUMNS = 'Twr_GIDNumer, Twr_GIDTyp, Twr_Kod, Twr_Nazwa, Twr_Jm, Twr_StawkaPodSpr'
export const productQueries = {
  products: `SELECT ${PRODUCT_COLUMNS} FROM CDN.TwrKarty WHERE (@query = '' OR Twr_Kod LIKE @pattern ESCAPE '\\' OR Twr_Nazwa LIKE @pattern ESCAPE '\\') ORDER BY Twr_Kod OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  productCount: "SELECT COUNT_BIG(1) AS Total FROM CDN.TwrKarty WHERE (@query = '' OR Twr_Kod LIKE @pattern ESCAPE '\\' OR Twr_Nazwa LIKE @pattern ESCAPE '\\')",
  productById: `SELECT ${PRODUCT_COLUMNS} FROM CDN.TwrKarty WHERE Twr_GIDNumer = @gidNumer AND Twr_GIDTyp = @gidTyp`
} as const
