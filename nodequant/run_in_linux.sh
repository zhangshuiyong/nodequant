#!/bin/sh
sudo cp ./model/client/CTP/linux/x64/lib* /usr/local/lib
sudo cp ./model/client/Sgit/linux/x64/lib* /usr/local/lib
sudo npm install
sudo npm install forever -g
sudo rm ~/.forever/forever.log
sudo forever start -l forever.log ./bin/www