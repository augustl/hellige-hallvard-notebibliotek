liturgi:
	node liturgi-pdf.js ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF/Liturgi.pdf

individuelle-pdf:
	mkdir -p ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF
	node individuelle-pdf.js ${MUSESCORE_BIN_PATH} ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH} ${HELLIGE_HALLVARD_NOTEBIBLIOTEK_PATH}/PDF