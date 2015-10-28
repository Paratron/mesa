<?
/**
 * Class User
 * =============
 *
 */

namespace CMS\Objects;

use CMS\REST\RestError;

class User
{

	/**
	 * Id of the object in database.
	 * @var {Integer}
	 */
	var $id;

	/**
	 * Reference to the Database object.
	 * @var {\Kiss\MySQLi}
	 */
	var $db;

	/**
	 * Database sync state
	 * @var {Boolean}
	 */
	var $dbSync;

	var $mail;

	private $password;

	var $username;

	var $lastLogin;

	var $loginTries;

	var $lastTry;

	/**
	 * Name of the related table in the database.
	 * @var string
	 */
	static $dbTable = 'users';

	function __construct(/* polymorph */)
	{
		global $db;
		$this->db = $db;

		if (func_num_args() === 1) {
			$arg0 = func_get_arg(0);

			if (is_array($arg0)) {
				$this->assignVars($arg0);
				if ($this->id) {
					$this->dbSync = TRUE;
				}
			}

			if (is_integer($arg0) || \Kiss\Utils::is_mail($arg0)) {
				if (is_integer($arg0)) {
					$sql = 'SELECT * FROM ' . self::$dbTable . ' WHERE id = ' . intval($arg0) . ';';
				} else {
					$sql = 'SELECT * FROM ' . self::$dbTable . ' WHERE mail = ' . $this->db->escape($arg0) . ';';
				}

				$result = $this->db->queryRow($sql);
				if (!$result) {
					throw new \ErrorException('Object not found in database');
				}
				$this->assignVars($result);
				$this->dbSync = TRUE;
			}

			return;
		}

		$this->creationTime = time();
	}

	function __set($name, $val){
		if($name === 'password'){
			$this->password = \Kiss\Utils::hash_password($val);
		}
	}

	/**
	 * Takes an array and assigns the properties to this object instance.
	 * @param {Array} $a
	 */
	private function assignVars($a)
	{
		$this->id = (int)$a['id'];
		$this->mail = $a['mail'];
		$this->password = $a['password'];
		$this->username = $a['username'];
		$this->lastLogin = $a['lastLogin'];
		$this->loginTries = $a['loginTries'];
		$this->lastTry = $a['lastTry'];
	}

	//-----------------------------------------------------------------------------------------------------

	/**
	 * Checks, if the given password can be used to authenticate the user
	 * @param $password
	 * @return string
	 */
	function auth($password)
	{
		if($this->loginTries){
			$waitTime = $this->loginTries * (5 * $this->loginTries);
			if($this->lastTry > time() - $waitTime){
				throw new RestError('Account locked', 7, array('remaining' => -(time() - ($this->lastTry + $waitTime))));
			}
		}
		$result = \Kiss\Utils::hash_password($password, $this->password) == $this->password;
		if(!$result){
			$this->lastTry = time();
			if($this->loginTries){
				$this->loginTries++;
			} else {
				$this->loginTries = 1;
			}
		} else {
			$this->lastLogin = time();
			$this->loginTries = 0;
		}
		$this->save();
		return $result;
	}

	/**
	 * Returns a Array representation of the object to be - for instance - be returned as a JSON object.
	 * @return array
	 */
	function getJSON()
	{
		return array(
				'id' => $this->id,
				'mail' => $this->mail,
				'username' => $this->username,
				'lastLogin' => $this->lastLogin,
				'loginTries' => $this->loginTries,
				'lastTry' => $this->lastTry,
				'gravatar' => md5($this->mail)
		);
	}

	/**
	 * Will write the objects information to the database.
	 * If the object doesn't exist in the database, it will be created and the returned Id will be set as $id property.
	 * Saving the object will set the $dbSync status to TRUE.
	 * @throws \ErrorException
	 */
	function save()
	{
		$this->modificationTime = time();

		$put = $this->getJSON();
		unset($put['id']);
		unset($put['gravatar']);
		$put['password'] = $this->password;

		if ($this->id) {
			$sql = 'UPDATE ' . self::$dbTable . ' SET ' . $this->db->makeSqlSetString($put) . ' WHERE id = ' . $this->id . ';';
			$this->db->query($sql);
		} else {
			$sql = 'INSERT INTO ' . self::$dbTable . $this->db->makeSqlValueString($put);
			$this->id = $this->db->queryInsert($sql);
		}

		$this->dbSync = TRUE;
	}
}