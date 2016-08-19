declare namespace fs {
    class FileReadStream {
        constructor(path: any, options: any);
        close(cb: any): any;
        destroy(): void;
        open(): void;
    }
    class FileWriteStream {
        constructor(path: any, options: any);
        close(cb: any): any;
        destroy(): void;
        destroySoon(chunk: any, encoding: any, cb: any): void;
        open(): void;
    }
    class ReadStream {
        constructor(path: any, options: any);
        close(cb: any): any;
        destroy(): void;
        open(): void;
    }
    class Stats {
        constructor(dev: any, mode: any, nlink: any, uid: any, gid: any, rdev: any, blksize: any, ino: any, size: any, blocks: any, atim_msec: any, mtim_msec: any, ctim_msec: any, birthtim_msec: any);
        isBlockDevice(): any;
        isCharacterDevice(): any;
        isDirectory(): any;
        isFIFO(): any;
        isFile(): any;
        isSocket(): any;
        isSymbolicLink(): any;
    }
    class SyncWriteStream {
        constructor(fd: any, options: any);
        destroy(): any;
        destroySoon(): any;
        end(data: any, arg1: any, arg2: any): void;
        write(data: any, arg1: any, arg2: any): any;
    }
    class WriteStream {
        constructor(path: any, options: any);
        close(cb: any): any;
        destroy(): void;
        destroySoon(chunk: any, encoding: any, cb: any): void;
        open(): void;
    }
    const F_OK: number;
    const R_OK: number;
    const W_OK: number;
    const X_OK: number;
    function access(path: any, mode: any, callback: any): void;
    function accessSync(path: any, mode: any): void;
    function appendFile(path: any, data: any, options: any, callback_: any, ...args: any[]): void;
    function appendFileSync(path: any, data: any, options: any): void;
    function chmod(path: any, mode: any, callback: any): void;
    function chmodSync(path: any, mode: any): any;
    function chown(target: any, uid: any, gid: any, cb: any): any;
    function chownSync(target: any, uid: any, gid: any): any;
    function close(fd: any, cb: any): void;
    function closeSync(fd: any): any;
    function createReadStream(path: any, options: any): any;
    function createWriteStream(path: any, options: any): any;
    function exists(path: any, callback: any): void;
    function existsSync(path: any): any;
    function fchmod(fd: any, mode: any, callback: any): void;
    function fchmodSync(fd: any, mode: any): any;
    function fchown(target: any, uid: any, gid: any, cb: any): any;
    function fchownSync(target: any, uid: any, gid: any): any;
    function fdatasync(fd: any, callback: any): void;
    function fdatasyncSync(fd: any): any;
    function fstat(fd: any, callback: any): void;
    function fstatSync(fd: any): any;
    function fsync(fd: any, callback: any): void;
    function fsyncSync(fd: any): any;
    function ftruncate(fd: any, len: any, callback: any): void;
    function ftruncateSync(fd: any, len: any): any;
    function futimes(fd: any, atime: any, mtime: any, callback: any): void;
    function futimesSync(fd: any, atime: any, mtime: any): void;
    function lchmod(path: any, mode: any, cb: any): void;
    function lchmodSync(): void;
    function lchown(path: any, uid: any, gid: any, cb: any): void;
    function lchownSync(): void;
    function link(srcpath: any, dstpath: any, callback: any): void;
    function linkSync(srcpath: any, dstpath: any): any;
    function lstat(path: any, callback: any): void;
    function lstatSync(path: any): any;
    function lutimes(_a: any, _b: any, _c: any, cb: any): void;
    function lutimesSync(): void;
    function mkdir(path: any, mode: any, callback: any): void;
    function mkdirSync(path: any, mode: any): any;
    function open(path: any, flags: any, mode: any, cb: any): void;
    function openSync(path: any, flags: any, mode: any): any;
    function read(fd: any, buffer: any, offset: any, length: any, position: any, callback_: any, ...args: any[]): any;
    function readFile(path: any, options: any, callback_: any, ...args: any[]): void;
    function readFileSync(path: any, options: any): any;
    function readSync(fd: any, buffer: any, offset: any, length: any, position: any): any;
    function readdir(path: any, cb: any): void;
    function readdirSync(path: any): any;
    function readlink(path: any, callback: any): void;
    function readlinkSync(path: any): any;
    function realpath(p: any, cache: any, cb: any): any;
    function realpathSync(p: any, cache: any): any;
    function rename(from: any, to: any, cb: any): any;
    function renameSync(oldPath: any, newPath: any): any;
    function rmdir(path: any, callback: any): void;
    function rmdirSync(path: any): any;
    function stat(path: any, callback: any): void;
    function statSync(path: any): any;
    function symlink(target: any, path: any, type_: any, callback_: any, ...args: any[]): void;
    function symlinkSync(target: any, path: any, type: any): any;
    function truncate(path: any, len: any, callback: any): any;
    function truncateSync(path: any, len: any): any;
    function unlink(path: any, callback: any): void;
    function unlinkSync(path: any): any;
    function unwatchFile(filename: any, listener: any): void;
    function utimes(path: any, atime: any, mtime: any, callback: any): void;
    function utimesSync(path: any, atime: any, mtime: any): void;
    function watch(filename: any, ...args: any[]): any;
    function watchFile(filename: any, options: any, listener: any): any;
    function write(fd: any, buffer: any, offset: any, length: any, position: any, callback: any): any;
    function writeFile(path: any, data: any, options: any, callback_: any, ...args: any[]): void;
    function writeFileSync(path: any, data: any, options: any): void;
    function writeSync(fd: any, buffer: any, offset: any, length: any, position: any): any;
}
