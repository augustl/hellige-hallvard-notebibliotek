liturgi: individuelle-pdf
	node liturgi-pdf.js ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi.pdf

liturgi-korperm-individuelle:
	node liturgi-korperm.js ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/Liturgi ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/Liturgi\ korperm

liturgi-korperm: liturgi-korperm-individuelle individuelle-pdf
	node liturgi-pdf.js ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi\ korperm ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi\ korperm.pdf

individuelle-pdf:
	mkdir -p ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF
	node individuelle-pdf.js ${MUSESCORE_BIN_PATH} ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH} ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF