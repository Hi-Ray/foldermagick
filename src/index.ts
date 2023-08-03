import fs from 'fs';
import path from 'path';

import chokidar from 'chokidar';

import IM from 'gm';

import IConfig from './interfaces/Config';

console.log('Starting FolderMagick...');

const magick = IM.subClass({ imageMagick: '7+' });

const defaultConfig = {
    imageMagickPath: '',
    ffmpegPath: '',
    workingDirectory: '',
};

const imageFormats = ['png', 'webp', 'gif', 'jpg'];

if (!fs.existsSync('config.json')) {
    console.log('No config found please create one...');
    process.exit(1);
}

console.log('An existing config has been found!');

const rawConfig = fs.readFileSync('config.json').toString('utf8');

const config: IConfig = JSON.parse(rawConfig);

// if (config.ffmpegPath === '') {
//     console.error('No ffmpeg path found!');
// }

if (!config.workingDirectory) {
    console.error('No working directory in config!');
    process.exit(1);
}

try {
    fs.mkdirSync(path.join(config.workingDirectory));
} catch (e) {
    console.debug(`Working directory already exists`);
}

imageFormats.forEach((folder) => {
    try {
        fs.mkdirSync(path.join(config.workingDirectory, folder));
    } catch (e) {
        console.debug(`Folder ${folder} already exists`);
    }
});

chokidar.watch(config.workingDirectory).on('all', (event, changePath) => {
    //console.log(event, changePath);
    switch (event) {
        case 'add':
            const fileType = changePath.substring(0, changePath.lastIndexOf('/')).split('/').pop();
            const filePath = changePath.substring(0, changePath.lastIndexOf('/'));

            const fileName = changePath.split('/').pop()?.split('.')[0];

            if (fileType === changePath.split('.')[1]) {
                console.log(`File type matches folder`);
                break;
            }

            magick(changePath).write(path.join(filePath, `${fileName}.${fileType}`), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                fs.unlinkSync(changePath);
                console.log(`Wrote to ${path.join(filePath, `${fileName}.${fileType}`)}`);
            });
            break;
    }
});
