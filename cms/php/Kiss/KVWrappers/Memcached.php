<?php
/**
 * Memcached
 * =========
 * Implements a Key/Value Storage interface for Memcached
 *
 * @author: Christian Engel <hello@wearekiss.com> 
 * @version: 1 06.02.15
 */

namespace Kiss\KVWrappers;

class Memcached extends \Kiss\KeyValueWrapper{
    private $mem;

    function __construct(){
        $this->mem = new \Memcached();

        if(!count($this->mem->getServerList())){
            $this->mem->addServer('127.0.0.1', 11211);
        }
    }

    function get($key){
        $v = $this->mem->get($key);
        if(!$key){
            return NULL;
        }
        return $v;
    }

    function set($key, $value, $expiration = 0){
        return $this->mem->set($key, $value, $expiration);
    }

    function remove($key){
        return $this->mem->delete($key);
    }
}
 