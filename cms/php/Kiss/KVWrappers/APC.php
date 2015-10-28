<?php
/**
 * APC
 * ===
 * Implements a Key/Value Storage interface for APC
 *
 * @author: Christian Engel <hello@wearekiss.com> 
 * @version: 1 01.03.14
 */

namespace Kiss\KVWrappers;

class APC extends \Kiss\KeyValueWrapper{
    function get($key){
        if(!apc_exists($key)){
            return NULL;
        }
        $dta = apc_fetch($key);

        if($dta[1] && $dta[1] < time()){
            apc_delete($key);
            return NULL;
        }
        return $dta[0];
    }

    function set($key, $value, $expiration = 0){
        if($expiration && $expiration < 2592000){
            $expiration = $expiration + time();
        }

        return apc_store($key, array($value, $expiration));
    }

    function remove($key){
        apc_delete($key);
    }
}
 