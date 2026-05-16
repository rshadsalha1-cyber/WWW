// data.js

// مصفوفة الدروس الكاملة والمطولة - المنهج الفلسطيني للصف الثالث
const ALL_LESSONS = [
    {
        id: 1,
        title: "ذَهَبُ الْأَرْضِ",
        content: "يُحْكَى أَنَّ أَخَوَيْنِ أَرَادَا أَنْ يَتَقَاسَمَا ثَرْوَةَ أَبِيهِمَا بَعْدَ وَفَاتِهِ، وَكَانَتِ الثَّرْوَةُ ذَهَباً وَأَرْضاً، فَاخْتَارَ الصَّغِيرُ الذَّهَبَ، وَتَرَكَ لِلْكَبِيرِ الْأَرْضَ. بَعْدَ مُرُورِ ثَلَاثَةِ أَعْوَامٍ، عَادَ الْأَخُ الصَّغِيرُ، وَهُوَ فِي حَالَةٍ سَيِّئَةٍ، وَقَالَ لِأَخِيهِ: لَمْ يَبْقَ مَعِي مِنَ الذَّهَبِ شَيْءٌ. أَخْرَجَ الْكَبِيرُ كِيساً، وَقَالَ: أَتَرَى هذا الذَّهَبَ؟ إِنَّهُ مِنْ تُرَابِ الْأَرْضِ، أَزْرَعُهَا، وَأَعْتَنِي بِهَا، فَأَحْصُلُ عَلَى خَيْرٍ وَفِيرٍ. مَنَحَ الْكَبِيرُ أَخَاهُ مَبْلَغاً مِنَ الْمَالِ، وَقَالَ: هَيَّا نَعْمَلْ، وَنَكْسِبْ رِزْقَنَا مِنْ أَرْضِنَا الطَّيِّبَةِ.",
        titleTimings: [
            { s: 2.250, e: 3.850 }
        ],
        sentences: [
            { s: 3.800, e: 9.250, wordStart: 0, wordEnd: 9 },
            { s: 9.250, e: 13.000, wordStart: 10, wordEnd: 13 },
            { s: 12.000, e: 18.080, wordStart: 14, wordEnd: 19 },
            { s: 18.000, e: 26.280, wordStart: 20, wordEnd: 30 },
            { s: 26.280, e: 31.280, wordStart: 31, wordEnd: 38 },
            { s: 31.280, e: 38.350, wordStart: 39, wordEnd: 45 },
            { s: 38.350, e: 41.250, wordStart: 46, wordEnd: 49 },
            { s: 41.250, e: 47.180, wordStart: 50, wordEnd: 56 },
            { s: 47.180, e: 52.250, wordStart: 57, wordEnd: 63 },
            { s: 52.250, e: 57.450, wordStart: 64, wordEnd: 70 }
        ]
    },
    {
        id: 2,
        title: "قَرْيَتُنَا نَظِيفَةٌ",
        content: "اقْتَرَحَتْ سَمَاحُ عَلَى طَالِبَاتِ صَفِّهَا أَنْ يَقُمْنَ بِحَمْلَةِ نَظَافَةٍ فِي الْقَرْيَةِ يَوْمَ الْجُمُعَةِ. سُرَّتِ الطَّالِبَاتُ بِاقْتِرَاحِ سَمَاحَ، وَفِي صَبَاحِ يَوْمِ الْجُمُعَةِ تَجَمَّعْنَ فِي سَاحَةِ الْقَرْيَةِ. انْقَسَمَتِ الطَّالِبَاتُ إِلَى مَجْمُوعَاتٍ، وَتَوَزَّعْتَ فِي حَارَاتِ الْقَرْيَةِ وَشَوَارِعِهَا: مَجْمُوعَةٌ تُنَظِّفُ الشَّارِعَ، وَأُخْرَى تَجْمَعُ النُّفَايَاتِ، وَثَالِثَةٌ تَنْقُلُ النُّفَايَاتِ إِلَى مَكَانِهَا الْمُخَصَّصِ. قَبْلَ الظُّهْرِ كَانَتِ الْقَرْيَةُ نَظِيفَةً، وَشَعَرَتِ الطَّالِبَاتُ بِالسَّعَادَةِ وَالسُّرُورِ؛ بِمَا قُمْنَ بِهِ. فِي الْيَوْمِ التَّالِي شَكَرَتْ مُدِيرَةُ الْمَدْرَسَةِ الطَّالِبَاتِ عَلَى مُبَادَرَتِهِنَّ، وَقَدَّمَتْ لَهُنَّ جَوَائِزَ تَقْدِيرِيَّةً، وَقَالَتْ: مَا أَجْمَلَ أَنْ تَظَلَّ قَرْيَتُنَا نَظِيفَةً!"
    },
    {
        id: 3,
        title: "الْعُصْفُورَةُ تَبْنِي عُشَّهَا",
        content: "رَاقَبَتْ سَنَاءُ عُصْفُورَةً تَطِيرُ مِنْ مَكَانٍ إِلَى آخَرَ، وَتَجْمَعُ الْقَشَّ. سَأَلَتْ أُمَّهَا: لِمَاذَا تَجْمَعُ الْعُصْفُورَةُ الْقَشَّ، يَا أُمِّي؟ الْأُمُّ: حَتَّى تَبْنِيَ عُشَّاً؛ لِتَسْكُنَ فِيهِ مَعَ فِرَاخِهَا. جَهَّزَتِ الْعُصْفُورَةُ عُشَّهَا، ثُمَّ بَاضَتْ فِيهِ، وَبَعْدَ فَتْرَةٍ شَاهَدَتْ سَنَاءُ عُصْفُورَيْنِ صَغِيرَيْنِ فِي الْعُشِّ. سُرَّتْ سَنَاءُ وَهِيَ تَرَى الْعُصْفُورَةَ الْأُمَّ تَلْتَقِطُ الْحَبَّ بِمِنْقَارِهَا، وَتَضَعُهُ فِي فَمِ كُلِّ وَاحِدٍ مِنَ الصَّغِيرَيْنِ. سَأَلَتْ سَنَاءُ: مَنْ عَلَّمَ الْعُصْفُورَةَ بِنَاءَ عُشِّهَا، وَإِطْعَامَ فِرَاخِهَا، يَا أُمِّي؟ تَبَسَّمَتِ الْأُمُّ، وَقَالَتْ: اللّٰهُ سُبْحَانَهُ، هُوَ الْهَادِي، وَهُوَ الرَّازِقُ."
    },
    {
        id: 4,
        title: "الْخَبَّازُ",
        content: "طَلَبَتْ أُمُّ بَاسِمٍ مِنْ ابْنِهَا أَنْ يَشْتَرِيَ لَهُمْ خُبْزاً، ذَهَبَ بَاسِمٌ إِلَى الْمَخْبَزِ، فَرَأَى الْخَبَّازَ يُرِقُّ الْعَجِينَ بِسُرْعَةٍ كَبِيرَةٍ، حَتَّى إِذَا اسْتَدَارَ وَضَعَهُ عَلَى خَشَبَةٍ طَوِيلَةٍ، وَرَمَى بِهِ إِلَى بَيْتِ النَّارِ. كَانَ الْخَبَّازُ مَاهِراً، وَكَانَ الْعَرَقُ يَقْطُرُ مِنْ جَبِينِهِ. عَادَ بَاسِمٌ إِلَى الْبَيْتِ يَحْمِلُ الْخُبْزَ السَّاخِنَ، وَقَالَ لِوَالِدِهِ: عَمَلُ الْخَبَّازِ شَاقٌّ يَا أَبِي. قَالَ الْوَالِدُ: نَعَمْ، إِنَّهُ يَعْمَلُ بِلَا كَلَلٍ لِإِطْعَامِنَا الْخُبْزَ الشَّهِيَّ، إِيَّاكَ يَا بُنَيَّ، أَنْ تَرْمِيَ الْخُبْزَ الزَّائِدَ عَنِ الْأَكْلِ، فَالْخُبْزُ نِعْمَةٌ مِنَ اللّٰهِ يَا وَلَدِي, يَجِبُ أَنْ نُحَافِظَ عَلَيْهَا."
    },
    {
        id: 5,
        title: "عَرُوسُ الْبَحْرِ",
        content: "أَنَا يَافَا، أَنَا عَرُوسُ الْبَحْرِ، أَنَا مَدِينَةٌ فِلَسْطِينِيَّةٌ، بَنَانِي أَجْدَادُكُمُ الْعَرَبُ الْقُدَمَاءُ قَبْلَ سِتَّةِ آلَافِ عَامٍ عَلَى سَاحِلِ الْبَحْرِ الْمُتَوَسِّطِ، كُنْتُ بَوَّابَةً لَهُمْ إِلَى الْعَالَمِ الْخَارِجِيِّ، وَمَا زَالَتِ السُّفُنُ تَرْسُو فِي مِينَائِي. فِي بَيَّارَاتِي تُزْرَعُ الْحَمْضِيَّاتُ وَالْفَوَاكِهُ، وَبُرْتُقَالِي مِنْ أَجْوَدِ أَنْوَاعِ الْبُرْتُقَالِ فِي الْعَالَمِ. يُشَاهِدُ السَّائِحُ عِنْدَمَا يَزُورُنِي الْأَمَاكِنَ التَّارِيخِيَّةَ، وَالْأَحْيَاءَ الْقَدِيمَةَ كَحَيِّ الْعَجَمِيِّ، كَمَا يَطْرَبُ وَهُوَ يَسْمَعُ صَوْتَ أَجْرَاسِ الْكَنَائِسِ يُعَانِقُ صَوْتَ الْأَذَانِ فِي الْمَسَاجِدِ، وَيُصَلِّي فِي مَسْجِدِ حَسَن بِيك، وَيَقْضِي وَقْتاً مُمْتِعاً عَلَى شَاطِئِي الْجَمِيلِ."
    },
    {
        id: 6,
        title: "بَرَاءُ لَا يَعْرِفُ الْيَأْسَ",
        content: "بَرَاءُ طِفْلٌ فِي الْعَاشِرَةِ مِنْ عُمُرِهِ، كَانَ سَعِيداً وَهُوَ يَعْمَلُ مَعَ إِخْوَتِهِ، وَأَخَوَاتِهِ فِي تَرْتِيبِ بَيْتِهِمُ الْجَدِيدِ. رَمَى بَرَاءُ قَضِيبَ حَدِيدٍ مِنَ الشُّبَّاكِ، وَلَمْ يَكُنْ يَعْلَمُ أَنَّ هَذَا الْقَضِيبَ سَيُغَيِّرُ مَجْرَى حَيَاتِهِ؛ إِذْ لَامَسَ السِّلْكَ الْكَهْرَبَائِيَّ، فَصَعَقَتْهُ الْكَهْرَبَاءُ؛ مَا أَدَّى إِلَى إِصَابَتِهِ بِإِعَاقَةٍ شَدِيدَةٍ فِي يَدَيْهِ. تَأَثَّرَ بَرَاءُ، وَشَعَرَ بِالْحُزْنِ؛ لِأَنَّهُ لَا يَسْتَطِيعُ مُشَارَكَةَ أَصْدِقَائِهِ وَهُمْ يَلْعَبُونَ، إِلَّا أَنَّهُ لَمْ يَيْأَسْ، وَصَمَّمَ عَلَى عَدَمِ الِاسْتِسْلَامِ لِلْوَاقِعِ الْجَدِيدِ، جَدَّ، وَاجْتَهَدَ، وَاهْتَمَّ بِدُرُوسِهِ. نَجَحَ بَرَاءُ فِي الثَّانَوِيَّةِ الْعَامَّةِ، وَالْتَحَقَ بِالْجَامِعَةِ، وَتَخَرَّجَ فِيهَا بِتَفَوُّقٍ، وَتَزَوَّجَ، ثُمَّ أَنْجَبَ أَطْفَالاً، وَهُوَ يَعْمَلُ الْآنَ فِي إِحْدَى الشَّرِكَاتِ، فَبَاتَ قِصَّةَ نَجَاحٍ يُضْرَبُ بِهَا الْمَثَلُ."
    },
    {
        id: 7,
        title: "حَيْفَا وَالنَّوْرَسُ",
        content: "حَيْفَا بِنْتٌ تَعِيشُ فِي بَيْتٍ مِنَ الصَّفِيحِ، قُرْبَ الْبَحْرِ فِي بَيْرُوتَ، تُحِبُّ الْبَحْرَ، وَتُحِبُّ جَدَّهَا الَّذِي يَصْحَبُهَا بِقَارِبِهِ الصَّغِيرِ، وَيَقُولُ لَهَا دَائِماً: حَيْفَا جَمِيلَةٌ. رَأَتْهُ ذَاتَ يَوْمٍ يَحْمِلُ شِبَاكَ الصَّيْدِ، وَيَتَّجِهُ نَحْوَ الْقَارِبِ. سَبَقَتْهُ وَجَلَسَتْ فِيهِ كَعَادَتِهَا، لَكِنَّهُ أَخَذَهَا بَيْنَ ذِرَاعَيْهِ، وَأَنْزَلَهَا قَائِلاً: لَا يُمْكِنُ أَنْ تَذْهَبِي مَعِي هَذِهِ الْمَرَّةَ يَا حَيْفَا؛ لِأَنَّنِي سَأُبْحِرُ بَعِيداً جِدّاً هَذَا الْيَوْمَ. صَعِدَ إِلَى الْقَارِبِ، وَقَالَ: هُنَاكَ حَيْفَا أُخْرَى تَنْتَظِرُنِي خَلْفَ الْبَحْرِ، جَمِيلَةٌ مِثْلُكِ، وَحِينَ أَعُودُ سَأُحَدِّثُكِ عَنْهَا كَثِيراً. دَفَعَ الْقَارِبَ بِيَدَيْهِ الْقَوِيَّتَيْنِ، وَأَبْحَرَ بَعِيداً، أَمَّا حَيْفَا، فَجَلَسَتْ عَلَى الرَّمْلِ تَنْتَظِرُ عَوْدَةَ جَدِّهَا، وَهِيَ تَبْكِي. سَمِعَهَا طَائِرُ النَّوْرَسِ، فَقَالَ لَهَا: لِمَاذَا أَنْتِ حَزِينَةٌ هَكَذَا؟ قَالَتْ حَيْفَا: جَدِّي يُحِبُّ بِنْتاً اسْمُهَا حَيْفَا، وَقَدْ تَرَكَنِي، وَذَهَبَ إِلَيْهَا. ضَحِكَ النَّوْرَسُ، وَقَالَ: حَيْفَا الْأُخْرَى لَيْسَتْ بِنْتاً، إِنَّهَا مَدِينَتُهُ الَّتِي وُلِدَ فِيهَا. بَقِيَتْ حَيْفَا عَلَى الشَّاطِئِ حَتَّى غُرُوبِ الشَّمْسِ تَحْلُمُ بِحَيْفَا الثَّانِيَةِ."
    },
    {
        id: 8,
        title: "مِنْ أَخْلَاقِنَا",
        content: "تَوَقَّفَتِ الْحَافِلَةُ فِي الْمَحَطَّةِ، صَعِدَتْ عَجُوزٌ إِلَى الْحَافِلَةِ، وَوَضَعَتْ حَقِيبَتَهَا عَلَى الرَّفِّ بَعْدَ جُهْدٍ كَبِيرٍ، وَعَلَامَاتُ التَّعَبِ تَبْدُو عَلَى وَجْهِهَا. بَحَثَتْ عَنْ مَقْعَدٍ لِتَجْلِسَ عَلَيْهِ، لَكِنَّهَا لَمْ تَجِدْ، وَقَفَ عَلِيٌّ، وَقَالَ: تَفَضَّلِي يَا جَدَّتِي، وَجَلَسَتْ مَكَانَهُ، وَقَالَتْ لَهُ: شُكْراً لَكَ يَا بُنَيَّ. وَصَلَتِ الْحَافِلَةُ إِلَى الْمَدِينَةِ، نَزَلَ الرُّكَّابُ مِنْهَا، حَاوَلَتِ الْعَجُوزُ أَنْ تَحْمِلَ حَقِيبَتَهَا الثَّقِيلَةَ، فَبَادَرَ عَلِيٌّ إِلَى مُسَاعَدَتِهَا، فَحَمَلَ الْحَقِيبَةَ، وَأَوْصَلَهَا إِلَى بَيْتِ النَّارِ. شَكَرَتِ الْعَجُوزُ عَلِيّاً مَرَّةً أُخْرَى، فَقَالَ لَهَا: يَا جَدَّتِي، عَوَّدَنِي وَالِدِي، وَعَلَّمَنِي مُعَلِّمِي أَنْ أُقَدِّمَ الْمُسَاعَدَةَ لِمَنْ يَحْتَاجُ. احْتَضَنَتْهُ، وَقَالَتْ: بَارَكَ اللّٰهُ فِيكَ يَا بُنَيَّ، وَكَثَّرَ مِنْ أَمْثَالِكَ."
    },
    {
        id: 9,
        title: "فِي مِينَاءِ غَزَّةَ",
        content: "وَصَلَ سَمِيرٌ وَوَالِدُهُ مِينَاءَ غَزَّةَ، وَنَزَلَا ضَيْفَيْنِ عَلَى أَبِي خَلِيلٍ أَشْهَرِ صَيَّادٍ فِي غَزَّةَ. تَجَوَّلَ سَمِيرٌ وَوَالِدُهُ فِي مِينَاءِ الصَّيَّادِينَ، دُهِشَ سَمِيرٌ وَهُوَ يَرَى حَرَكَةَ الصَّيَّادِينَ النَّشِطَةَ فِي الْمِينَاءِ، فَهَذَا يُصْلِحُ شِبَاكَهُ، وَهَذَا يُجَرِّبُ قَارِبَهُ، وَآخَرُ يُنَظِّفُ الْمَكَانَ الَّذِي يَجْمَعُ فِيهِ السَّمَكَ، وَقُرْبَ الْمَرَاكِبِ الرَّاسِيَةِ كَانَتْ مَجْمُوعَةٌ مِنَ الصَّيَّادِينَ تَشْوِي السَّمَكَ. صَعِدَ سَمِيرٌ وَوَالِدُهُ مَرْكَبَ أَبِي خَلِيلٍ فِي نُزْهَةٍ بَحْرِيَّةٍ، اسْتَمْتَعَ سَمِيرٌ وَالْقَارِبُ يَتَهَادَى فِي الْبَحْرِ، كَمَا اسْتَمْتَعَ بِغِنَاءِ الصَّيَّادِينَ لِلْبَحْرِ وَالْبَحَّارَةِ، وَبِالْحَدِيثِ عَنْ أَنْوَاعِ السَّمَكِ الْغَزِّيِّ، مِثْلَ: السَّرْدِينِ، وَالسُّلْطَانِ إِبْرَاهِيمَ، وَالدِّنِيسِ، وَغَيْرِهَا. فِي نِهَايَةِ الرِّحْلَةِ، قَالَ وَالِدُ سَمِيرٍ: مَا أَجْمَلَ الْبَحْرَ! وَمَا أَنْقَى هَوَاءَهُ!، وَمَا أَكْثَرَ خَيْرَاتِهِ!، وَتَابَعَ أَبُو خَلِيلٍ: وَمَا أَجْمَلَ أَنْ تَكُونَ صَيَّاداً!"
    },
    {
        id: 10,
        title: "الْمُبْدِعَةُ الصَّغِيرَةُ",
        content: "عَرِينُ طَالِبَةٌ مُجْتَهِدَةٌ، تُتَابِعُ وَاجِبَاتِهَا الْمَدْرَسِيَّةَ كُلَّ يَوْمٍ، ثُمَّ تَقْضِي وَقْتاً مَعَ الْحَاسُوبِ، تَزُورُ الْمَوَاقِعَ التَّعْلِيمِيَّةَ وَالتَّرْفِيهِيَّةَ. عَرِينُ تُحِبُّ الْحَاسُوبَ، وَصَمَّمَتْ أَنْ تَتَمَيَّزَ فِي مَجَالِهِ. طَلَبَتْ عَرِينُ مِنْ وَالِدِهَا أَنْ يُلْحِقَهَا بِدَوْرَةٍ مُتَقَدِّمَةٍ فِي الْحَاسُوبِ، وَافَقَ الْوَالِدُ، عَلَى أَلَّا يُؤَثِّرَ ذَلِكَ سَلْباً عَلَى دِرَاسَتِهَا، وَفِي الدَّوْرَةِ أَبْدَتْ عَرِينُ مَهَارَةً فَائِقَةً فِي بَرَامِجِ الْإِنْتَرْنِتِ، سَأَلَهَا الْمُدَرِّبُ: لِمَ تَتَعَلَّمِينَ الْحَاسُوبَ، يَا عَرِينُ؟ أَجَابَتْ عَرِينُ: أُرِيدُ أَنْ أَتَمَيَّزَ فِي مَجَالِ الْبَرْمَجِيَّاتِ، وَأَكُونَ مُبْدِعَةً. أَنْهَتْ عَرِينُ الدَّوْرَةَ، وَعَرَضَتْ عَلَى مُعَلِّمَةِ الْحَاسُوبِ فِكْرَةَ إِنْشَاءِ مَوْقِعٍ تَعْلِيمِيٍّ خَاصٍّ بِالْمَدْرَسَةِ، شَجَّعَتْهَا الْمُعَلِّمَةُ، وَبَعْدَ فَتْرَةٍ وَجِيزَةٍ تَمَّ إِطْلَاقُ مَوْقِعِ الْمَدْرَسَةِ التَّعْلِيمِيِّ. سُرَّتِ الطَّالِبَاتُ بِالْمَوْقِعِ؛ إِذْ سَاعَدَهُنَّ فِي تَعَلُّمِ الدُّرُوسِ، وَأَطْلَقَتِ الطَّالِبَاتُ عَلَى عَرِينُ لَقَبَ (الْمُبْدِعَةُ الصَّغِيرَةُ) وَكَرَّمَتِ الْمَدْرَسَةُ عَرِينُ عَلَى هَذَا الْإِنْجَازِ."
    },
    {
        id: 11,
        title: "قَمْحُ بِلَادِي",
        content: "أَحَبَّ سَعِيدٌ أَنْ يُرَافِقَ أَبَاهُ إِلَى حُقُولِ الْقَمْحِ؛ لِيُشَاهِدَ عَمَلِيَّةَ الْحَصَادِ، فَالْمَوْسِمُ جَيِّدٌ هَذَا الْعَامَ، وَالْخَيْرُ وَفِيرٌ. لَمْ يَسْتَطِعْ سَعِيدٌ النَّوْمَ تِلْكَ اللَّيْلَةَ، فَهُوَ فِي شَوْقٍ لِرُؤْيَةِ الْحَصَادِ. جَهَّزَ نَفْسَهُ مُنْذُ الصَّبَاحِ الْبَاكِرِ، وَخَرَجَ مَعَ أَبِيهِ إِلَى الْحَقْلِ. سَأَلَ وَالِدَهُ: مَاذَا نَنْتَظِرُ يَا وَالِدِي؟ أَجَابَ الْوَالِدُ: الْحَصَّادَةَ، يَا بُنَيَّ. بَعْدَ وَقْتٍ قَصِيرٍ، وَصَلَتِ الْحَصَّادَةُ، وَعِنْدَمَا شَاهَدَهَا سَعِيدٌ، صَاحَ: مَا أَضْخَمَ هَذِهِ الْآلَةَ! وَبَدَأَتِ الْحَصَّادَةُ تَقُصُّ السَّنَابِلَ عَنْ سِيقَانِهَا الْجَافَّةِ، وَتَفْصِلُ حُبُوبَ الْقَمْحِ الذَّهَبِيَّةَ فِي أَكْيَاسٍ خَاصَّةٍ، وَتَجْمَعُ الْقَشَّ فِي حُزَمٍ مُنْتَظِمَةٍ. سُرَّ سَعِيدٌ بِرُؤْيَةِ الْأَكْيَاسِ الْكَثِيرَةِ الَّتِي نَقَلَهَا الْأَبُ بِالْجَرَّارِ إِلَى الْبَيْتِ، فَرِحَتِ الْجَدَّةُ بِجَمْعِ الْمَحْصُولِ، فَطَحَنَتْ قَلِيلاً مِنَ الْقَمْحِ، وَأَعَدَّتِ الْخُبْزَ الشَّهِيَّ. أَكَلُوا، وَحَمِدُوا اللّٰهَ عَلَى هَذِهِ النِّعْمَةِ، ابْتَسَمَ الْأَبُ، وَقَالَ: لَا خَيْرَ فِي أُمَّةٍ تَأْكُلُ مِمَّا لَا تَزْرَعُ."
    },
    {
        id: 12,
        title: "زِيَارَةٌ إِلَى مَدِينَةِ الْعِنَبِ",
        content: "سَمَاحُ طَالِبَةٌ تَدْرُسُ فِي كُلِّيَّةِ الزِّرَاعَةِ فِي جَامِعَةِ النَّجَاحِ الْوَطَنِيَّةِ، تَلَقَّتْ دَعْوَةً؛ لِزِيَارَةِ مِهْرَجَانِ الْعِنَبِ فِي جَامِعَةِ الْخَلِيلِ. الْتَقَتْ هُنَاكَ بِصَدِيقَتِهَا خُلُودَ الَّتِي يَمْلِكُ وَالِدُهَا كُرُوماً مِنَ الْعِنَبِ، أُعْجِبَتْ سَمَاحُ بِأَنْوَاعِ الْعِنَبِ، وَأَلْوَانِهِ الْجَمِيلَةِ، وَقَدْ زَادَ إِعْجَابُهَا عِنْدَمَا تَذَوَّقَتْ بَعْضَ الْأَنْوَاعِ، فَوَجَدَتْهَا حُلْوَةً كَالْعَسَلِ. سَمَاحُ: كَمْ عَدَدُ أَصْنَافِ الْعِنَبِ فِي الْخَلِيلِ؟ خُلُودُ: يُزْرَعُ فِي الْخَلِيلِ حَوَالَيْ خَمْسَةَ عَشَرَ صِنْفاً، مِنْهَا: الدَّابُوقِيُّ، وَالْجَنْدَلِيُّ، وَالزَّيْنِيُّ، وَالْحَلْوَانِيُّ، وَغَيْرُهَا. سَمَاحُ: هَلْ تُعَمِّرُ شَجَرَةُ الْعِنَبِ طَوِيلاً؟ خُلُودُ: بَعْضُ الْأَنْوَاعِ تَعِيشُ قُرَابَةَ مِئَةٍ وَخَمْسِينَ عَاماً كَالْجَنْدَلِيِّ، وَبَعْضُهَا لَا يَعِيشُ أَكْثَرَ مِنْ سِتِّينَ عَاماً، وَنَصْنَعُ مِنَ الْعِنَبِ الدِّبْسَ، وَالزَّبِيبَ، وَالْمُرَبَّى، وَالْمَلْبَنَ، وَغَيْرَهَا. غَادَرَتْ سَمَاحُ مَدِينَةَ الْعِنَبِ مُحَمَّلَةً بِإِرْثٍ فِلَسْطِينِيٍّ، تَغَنَّى بِهِ الشُّعَرَاءُ، وَوَصَفُوهُ بِالشَّهْدِ؛ لِحَلَاوَتِهِ."
    }
];

// --- Leaderboard Settings ---
// ضع رابط الـ CSV الخاص بملف Google Sheets هنا بعد نشره على الويب
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbxGxfJSwT7jpGI1hdPuRaBKsesTvJuRnWGNu7gKFPx357Av1VB9mUoWdFzba3rWnpJx/exec";

class DataManager {
    // --- ميزات المزامنة مع الأندرويد للحفاظ على البيانات ---
    static _syncToNative(key, value) {
        if (window.AndroidSpeech && window.AndroidSpeech.saveData) {
            window.AndroidSpeech.saveData(key, value);
        }
    }

    static _getFromNative(key, defaultValue) {
        if (window.AndroidSpeech && window.AndroidSpeech.getData) {
            return window.AndroidSpeech.getData(key, defaultValue);
        }
        return defaultValue;
    }

    static getStudentId() {
        let id = localStorage.getItem('student_id');
        // إذا لم يوجد في الويب، جرب البحث في الأندرويد
        if (!id) id = this._getFromNative('student_id', null);
        
        if (!id) {
            id = 'SID-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            localStorage.setItem('student_id', id);
            this._syncToNative('student_id', id);
        }
        return id;
    }

    static getStudentName() {
        let name = localStorage.getItem('student_name');
        if (!name) name = this._getFromNative('student_name', null);
        return name;
    }

    static saveStudentName(name) {
        localStorage.setItem('student_name', name);
        this._syncToNative('student_name', name);
        // إضافة تحديث الاسم لطابور المزامنة لضمان تحديثه في قوقل شيت
        this.addToSyncQueue({
            type: 'UPDATE_PROFILE',
            studentId: this.getStudentId(),
            studentName: name,
            score: this.getGlobalScore(),
            timestamp: new Date().toISOString()
        });
    }

    static getGlobalScore() {
        let score = localStorage.getItem('global_score');
        if (score === null) score = this._getFromNative('global_score', '0');
        return parseInt(score) || 0;
    }

    static saveGlobalScore(score) {
        const safeScore = Math.max(0, parseInt(score) || 0);
        localStorage.setItem('global_score', safeScore);
        this._syncToNative('global_score', safeScore.toString());
        // إضافة تحديث النقاط لطابور المزامنة
        this.addToSyncQueue({
            type: 'UPDATE_SCORE',
            studentId: this.getStudentId(),
            studentName: this.getStudentName(),
            score: safeScore,
            timestamp: new Date().toISOString()
        });
    }

    // --- نظام طابور المزامنة (Offline Sync Queue) ---
    static getSyncQueue() {
        return JSON.parse(localStorage.getItem('sync_queue')) || [];
    }

    static addToSyncQueue(data) {
        const queue = this.getSyncQueue();
        queue.push(data);
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        // محاولة المزامنة فوراً إذا كان هناك إنترنت
        if (typeof SyncManager !== 'undefined') SyncManager.trySync();
    }

    static clearSyncQueue() {
        localStorage.setItem('sync_queue', JSON.stringify([]));
    }

    static getStudentPhoto() {
        return localStorage.getItem('student_photo') || null;
    }

    static saveStudentPhoto(base64) {
        localStorage.setItem('student_photo', base64);
    }

    static clearStudentPhoto() {
        localStorage.removeItem('student_photo');
    }

    static getHistory() {
        return JSON.parse(localStorage.getItem('reading_history')) || [];
    }

    static addToHistory(lessonTitle, pointsEarned, pointsLost, correctWords, totalWords, wrongWords) {
        const history = this.getHistory();
        history.unshift({
            title: lessonTitle,
            pointsEarned: pointsEarned || 0,
            pointsLost: pointsLost || 0,
            correctWords: correctWords || 0,
            totalWords: totalWords || 0,
            wrongWords: wrongWords || [],
            date: new Date().toLocaleDateString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });
        // Keep only last 10 records
        localStorage.setItem('reading_history', JSON.stringify(history.slice(0, 10)));
    }

    static getReadingStrictness() {
        return localStorage.getItem('reading_strictness') || 'medium';
    }

    static saveReadingStrictness(level) {
        localStorage.setItem('reading_strictness', level);
    }

    static getReadingPhilosophy() {
        return localStorage.getItem('reading_philosophy') || 'standard';
    }

    static saveReadingPhilosophy(philosophy) {
        localStorage.setItem('reading_philosophy', philosophy);
    }

    static getSpeechEnginePreference() {
        const saved = localStorage.getItem('speech_engine_pref');
        if (saved) return saved;
        
        // إذا كان التطبيق يعمل داخل الأندرويد، الافتراضي هو أوفلاين
        // إذا كان متصفح عادي، الافتراضي هو أونلاين
        return (window.AndroidSpeech) ? 'vosk' : 'online';
    }

    static saveSpeechEnginePreference(pref) {
        localStorage.setItem('speech_engine_pref', pref);
    }

    static getTTSRate() {
        return parseFloat(localStorage.getItem('tts_rate')) || 1.0;
    }

    static saveTTSRate(rate) {
        localStorage.setItem('tts_rate', rate);
    }

    static async fetchAndSyncLessons() {
        return ALL_LESSONS; // إرجاع المصفوفة الثابتة
    }

    static async fetchLeaderboardData() {
        // Always try to return cache first for speed, or if offline
        const cached = this.getCachedLeaderboard();

        if (!navigator.onLine) {
            console.log('App is offline. Using cached leaderboard.');
            return cached;
        }

        try {
            const targetUrl = LEADERBOARD_URL || `leaderboard.json?t=${new Date().getTime()}`;
            const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) }); // 5s timeout
            if (!response.ok) throw new Error('تعذر الوصول لمصدر البيانات');

            const contentType = response.headers.get('content-type');
            const isCSV = LEADERBOARD_URL && (
                LEADERBOARD_URL.includes('format=csv') ||
                LEADERBOARD_URL.includes('output=csv') ||
                (contentType && contentType.includes('text/csv'))
            );

            let results = [];
            if (isCSV) {
                const csvData = await response.text();
                results = this.parseCSVToLeaderboard(csvData);
            } else {
                const jsonData = await response.json();
                results = jsonData.map(item => ({
                    name: item.studentName || item.name || item.Student_Name || "طالب",
                    score: parseInt(item.score || item.Total_Points || item.points || 0)
                }));
            }

            // Save to cache if we got valid results
            if (results && results.length > 0) {
                this.saveCachedLeaderboard(results);
                return results;
            }
            return cached;
        } catch (error) {
            console.warn('Leaderboard fetch failed, using cache:', error.message);
            return cached;
        }
    }

    static getCachedLeaderboard() {
        const cached = localStorage.getItem('cached_leaderboard');
        return cached ? JSON.parse(cached) : [];
    }

    static saveCachedLeaderboard(data) {
        localStorage.setItem('cached_leaderboard', JSON.stringify(data));
    }

    static getLocalLeaderboardFallback() {
        return this.getCachedLeaderboard();
    }

    static getLessonProgress(lessonId) {
        return parseInt(localStorage.getItem(`lesson_progress_${lessonId}`)) || 0;
    }

    static saveLessonProgress(lessonId, progress) {
        localStorage.setItem(`lesson_progress_${lessonId}`, progress);
    }

    static parseCSVToLeaderboard(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) return [];

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

            // Find indices for Name and Score
            const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('الاسم') || h.includes('student'));
            const scoreIndex = headers.findIndex(h => h.includes('score') || h.includes('نقاط') || h.includes('درجة') || h.includes('total') || h.includes('points'));

            if (nameIndex === -1 || scoreIndex === -1) {
                console.warn("Could not find required columns in CSV. Falling back to index 0 and 1.");
            }

            const nIdx = nameIndex !== -1 ? nameIndex : 0;
            const sIdx = scoreIndex !== -1 ? scoreIndex : 1;

            const results = [];
            for (let i = 1; i < lines.length; i++) {
                const columns = lines[i].split(',');
                if (columns.length > Math.max(nIdx, sIdx)) {
                    results.push({
                        name: columns[nIdx].trim().replace(/^"|"$/g, ''),
                        score: parseInt(columns[sIdx].trim()) || 0
                    });
                }
            }
            return results;
        } catch (e) {
            console.error("CSV Parsing error:", e);
            return [];
        }
    }
}
window.DataManager = DataManager;