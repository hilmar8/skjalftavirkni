Lifandi kort yfir skjálftavirkni
==============
Lifandi kort yfir skjálftavirkni í kringum Holuhrauns gosið 2014. Kortið er hýst á http://virkni.net

Uppsetning
-----------
Til að setja upp forritið þarf nodejs, npm og python að vera uppsett.

```sh
npm install -g grunt-cli bower
git clone https://github.com/hilmarh/skjalftavirkni.git skjalftavirkni
cd skjalftavirkni
npm install
bower install
```

Gögnin eru sótt frá Veðurstofu Íslands á slóðinni http://hraun.vedur.is/ja/viku/sidasta/index.html. Viðeigandi vika er valin, smellt er á skjálftavirkni og gögnin eru vistuð sem vika**.txt.

Til að keyra gögnin inn í forritið er python scriptan keyrð upp

```sh
python parse.py # Passa þarf að vika**.txt sé inn í python scriptu.
```

Til að keyra forritið upp í prufuumhverfi er keyrt

```sh
grunt serve # Forritið verður aðgengilegt á http://localhost:9000/
```

Til að pakka forritinu fyrir raunumhverfi er keyrt

```sh
grunt build
cd dist/ # Hér kemur raunumhverfisútgáfan
```

Höfundur
-----------
Höfundur er Hilmar Ævar Hilmarsson. Hægt er að ná sambandi við hann í gegnum netfangið hilmarh (hjá) gmail.com.