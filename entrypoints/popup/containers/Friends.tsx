import { type FormEvent, useState } from 'react';
import type { Friend } from '@/model/types';
import { sendRequestToBackground } from '@/utils/messages';
import { Modal } from '../components/Modal';
import './Friends.css';

/** The Friends page: my address and the friends I can send to. */
export function Friends({ address }: { address: string | null }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [friendAddress, setFriendAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [copied, setCopied] = useState(false);

  const closeAdd = (): void => setAddOpen(false);

  const generateAddress = (): void => {
    void sendRequestToBackground({ type: 'generate-address' });
  };

  const copyAddress = async (): Promise<void> => {
    if (address === null) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const addFriend = (event: FormEvent): void => {
    event.preventDefault();
    const added = friendAddress.trim();
    if (friends.some((friend) => friend.address === added)) return;
    setFriends([...friends, { address: added, nickname: nickname.trim() }]);
    setFriendAddress('');
    setNickname('');
    closeAdd();
  };

  const removeFriend = (friend: Friend): void => {
    setFriends(friends.filter((other) => other.address !== friend.address));
  };

  const canAdd = friendAddress.trim() !== '' && nickname.trim() !== '';

  return (
    <div className="view">
      <div className="friends-block my-address">
        <p className="friends-title">My address</p>
        {!address ? (
          <>
            <p className="friends-hint">
              Send this address to a friend, and they can gift you Pokémon.
            </p>
            <button type="button" className="cta" onClick={generateAddress}>
              Generate address
            </button>
          </>
        ) : (
          <button
            type="button"
            className="copy-address"
            onClick={() => void copyAddress()}
          >
            {address}
          </button>
        )}
      </div>

      {addOpen && (
        <Modal title="Add a friend" onClose={closeAdd}>
          <form onSubmit={addFriend}>
            <input
              className="input"
              value={friendAddress}
              placeholder="Friend's address"
              aria-label="Friend's address"
              onChange={(event) => setFriendAddress(event.target.value)}
            />
            <input
              className="input"
              value={nickname}
              placeholder="Nickname"
              aria-label="Nickname"
              onChange={(event) => setNickname(event.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="friends-link" onClick={closeAdd}>
                Cancel
              </button>
              <button type="submit" className="action" disabled={!canAdd}>
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="friends-block">
        <p className="friends-title">Friends ({friends.length})</p>
        <button type="button" className="cta" onClick={() => setAddOpen(true)}>
          Add a friend
        </button>
        {friends.length === 0 ? (
          <p className="friends-hint">No friends yet.</p>
        ) : (
          <div className="friend-list">
            {friends.map((friend) => (
              <div className="friend" key={friend.address}>
                <p className="friend-head">
                  <span className="friend-nickname">{friend.nickname}</span>
                  <button
                    type="button"
                    className="friends-link"
                    onClick={() => removeFriend(friend)}
                  >
                    Remove
                  </button>
                </p>
                <p className="friend-address">{friend.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className={`toast ${copied ? 'show' : ''}`} role="status">
        Address copied
      </p>
    </div>
  );
}
