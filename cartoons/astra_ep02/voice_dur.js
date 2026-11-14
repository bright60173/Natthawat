// seconds per dialogue line in script order; drives subtitle length and shot trimming.
// Lines 1-11 are measured from voice/NN.mp3; the rest are estimates (speech rate of the recorded lines + 12%) until they are recorded.
const VOICE_SEC = [3.396, 5.878, 3.082, 6.687, 2.194, 2.194, 2.429, 1.071, 7.393, 4.049, 1.149, 6.224, 5.442, 3.43, 10.248, 3.765, 7.789, 2.536, 2.536, 3.206, 3.989, 4.548, 4.659, 5.218, 1.865, 4.1, 5.107, 4.212, 2.536, 6.895, 3.318, 6.895, 3.206, 2.871, 1.977, 6.895, 3.318, 8.572, 3.542, 4.324, 6.336, 8.013, 3.318, 4.212, 7.566, 7.789, 2.424, 1.2, 6.671, 5.218];
