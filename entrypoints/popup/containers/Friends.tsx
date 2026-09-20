import { type FormEvent, useState } from 'react';
import type { Friend } from '@/model/types';
import { sendRequestToBackground } from '@/utils/messages';
import { Modal } from '../components/Modal';
import './Friends.css';

export function Friends({ friends }: { friends: Record<string, Friend> }) {
  const [addOpen, setAddOpen] = useState(false);
  const [friendAddress, setFriendAddress] = useState('');
  const [nickname, setNickname] = useState('');

  const list = Object.values(friends);

  const closeAdd = (): void => setAddOpen(false);

  const addFriend = (event: FormEvent): void => {
    event.preventDefault();
    const added = friendAddress.trim();
    if (friends[added] !== undefined) return;
    void sendRequestToBackground({
      type: 'add-friend',
      address: added,
      nickname: nickname.trim(),
    });
    setFriendAddress('');
    setNickname('');
    closeAdd();
  };

  const removeFriend = (friend: Friend): void => {
    void sendRequestToBackground({
      type: 'remove-friend',
      address: friend.address,
    });
  };

  const canAdd = friendAddress.trim() !== '' && nickname.trim() !== '';

  return (
    <div className="view">
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
        <button type="button" className="cta" onClick={() => setAddOpen(true)}>
          Add a friend
        </button>
        <p className="friends-title">Friends ({list.length})</p>
        {list.length === 0 ? (
          <p className="friends-hint">
            No friends yet. Add friends to share your Pokémon with them.
          </p>
        ) : (
          <div className="friend-list">
            {list.map((friend) => (
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
    </div>
  );
}
