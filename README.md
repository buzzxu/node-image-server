# node-image-server

###PM2 安装
```
npm install pm2 -g
```
### ImageMagic 安装
```
yum install libpng libjpeg
```
###先从此地址下载 支持的图片格式 JPG PNG等
```
http://www.imagemagick.org/download/delegates/
```
### 安装jpeg
```
tar xvfz jpegsrc.v9b.tar.gz
cd jpeg-9b
./configure --enable-shared --prefix=$CONFIGURE_PREFIX
make
make install
```
### 安装PNG
```
libpng-1.6.31.tar.xz
./configure
```
## webp 安装
```
yum info libwebp
```
### mac brew 安装
```
brew instal webp
brew install imagemagick --with-webp
```
## 最后安装ImageMagick
```
cd /usr/local/src
wget https://www.imagemagick.org/download/ImageMagick.tar.gz
tar xvfz ImageMagick.tar.gz
cd ImageMagick
export CPPFLAGS=-I/usr/local/include
export LDFLAGS=-L/usr/local/lib
./configure --prefix=/usr/local --disable-static --with-modules --without-perl --without-magick-plus-plus --with-quantum-depth=8 --disable-openmp
make
sudo make install
make uninstall
```




## 使用
#### 上传文件
```
POST 127.0.0.1:7589/images/upload
Content-Type: form-data
files: FILE
文件
folder:STRING
文件目录
gif:Number
多张图片是否转gif，每一帧的播放时间（秒）
loop:Number
循环多少次
webp:STRING (convert|add)
 convert:转换为webp格式文件
 add:  多生成一张webp文件
```
#### 删除文件
```
DELETE http://127.0.0.1:7589/images/delete?file={文件路径}
```
#### 读取资源
```
GET    http://127.0.0.1:7589/images/:folder+/:filename?size={宽*高}&quality={质量:Number}&format={格式}&Line{渐进式}
folder:目录  /a/b/c/
filename:文件名
支持参数
```



