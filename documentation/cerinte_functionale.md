# Cerințe funcționale — calculator

## Implementat

- Utilizatorul încarcă o fotografie în browser.
- Sunt disponibile modurile **Standard Resin Area** și **Wood Boundary**.
- Calibrarea folosește una sau mai multe măsurători de referință; o măsurătoare validă are lungime pozitivă și două puncte valide.
- Modul Wood Boundary permite definirea formei, a insulelor de lemn și a cavităților de rășină.
- Backend-ul calculează aria, volumul și recomandarea cu marjă de siguranță de 10%.
- Exportul este controlat de capabilitățile contului.

## Reguli

- Nu se folosește recunoaștere AI a imaginii.
- Logica de calcul și validarea cererilor sunt în backend; desenarea interactivă rămâne în browser.
- Un proiect salvat necesită fotografie și cel puțin o măsurătoare de referință completă.

## TODO

Adaugă avertismente euristice pentru măsurători de referință incompatibile sau pentru calibrare insuficientă. Avertismentul trebuie să explice problema fără a pretinde analiză AI.
