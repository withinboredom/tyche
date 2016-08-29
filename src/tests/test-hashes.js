import {hashFile, hashFileList} from 'lib/config/hash';


hashFile(`${__dirname}/../../assets/tests/configs/simple-config.json`).then(hash => {
    console.log('single file:', hash);
});

const list = [
    `${__dirname}/../../assets/tests/configs/simple-config.json`,
    `${__dirname}/../../assets/hook.js`
];

hashFileList(list).then(hash => {
    console.log('multiple file:', hash);
});
